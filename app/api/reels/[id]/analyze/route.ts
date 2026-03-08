import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { analyzeReel } from '@/lib/gemini/analyze'
import { analyzeBusinessPotential, isBusinessRelevant } from '@/lib/gemini/business-analyze'
import { extractReelMetadata } from '@/lib/instagram/extract'

const REEL_SELECT = '*, category:categories!reels_category_id_fkey(id,name,slug,color,icon,type), profile:categories!reels_profile_id_fkey(id,name,slug,color,icon,type)'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createRouteClient()
  const { data: { user: sessionUser } } = await supabase.auth.getUser()

  // Allow internal calls from iOS Shortcut / shortcuts API via X-Internal-Token
  let user = sessionUser ?? null
  if (!user) {
    const internalToken = _req.headers.get('x-internal-token')
    if (internalToken && internalToken === process.env.SHORTCUT_TOKEN) {
      const { data: reelRow } = await adminSupabase
        .from('reels').select('user_id').eq('id', params.id).single()
      if (reelRow) user = { id: reelRow.user_id } as typeof sessionUser
    }
  }

  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const { data: reel, error: fetchError } = await supabase
    .from('reels')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !reel) return NextResponse.json({ error: 'Reel nicht gefunden' }, { status: 404 })

  await supabase.from('reels').update({ analysis_status: 'processing' }).eq('id', params.id)

  try {
    const { data: userCategories } = await supabase
      .from('categories')
      .select('name')
      .eq('user_id', user.id)
      .eq('type', 'category')
    const categoryNames = (userCategories ?? []).map((c: { name: string }) => c.name)

    // Auto-extract metadata if missing (bulk imports only have URL)
    let currentReel = reel
    if (!reel.external_thumbnail && !reel.thumbnail_url && !reel.title) {
      try {
        const meta = await extractReelMetadata(reel.url)
        if (meta.external_thumbnail || meta.title || meta.author_username) {
          await supabase.from('reels').update({
            external_thumbnail: meta.external_thumbnail,
            instagram_id: meta.instagram_id ?? reel.instagram_id,
            title: meta.title,
            author_username: meta.author_username,
            author_name: meta.author_name,
            description: meta.description,
            updated_at: new Date().toISOString(),
          }).eq('id', params.id)
          currentReel = { ...reel, ...meta }
        }
      } catch { /* Continue without metadata */ }
    }

    let thumbnailBase64: string | null = null
    const thumbUrl = currentReel.thumbnail_url || currentReel.external_thumbnail

    if (thumbUrl) {
      try {
        const imgResponse = await fetch(thumbUrl)
        const buffer = await imgResponse.arrayBuffer()
        thumbnailBase64 = Buffer.from(buffer).toString('base64')
      } catch { /* Continue without image */ }
    }

    // Save thumbnail to Supabase Storage if not already stored
    if (thumbnailBase64 && !currentReel.thumbnail_url) {
      try {
        const imageBuffer = Buffer.from(thumbnailBase64, 'base64')
        const storagePath = `${user.id}/${params.id}.jpg`

        const { error: uploadError } = await supabase.storage
          .from('thumbnails')
          .upload(storagePath, imageBuffer, {
            contentType: 'image/jpeg',
            upsert: true,
          })

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('thumbnails')
            .getPublicUrl(storagePath)

          // Update thumbnail_url in the DB
          await supabase.from('reels').update({ thumbnail_url: publicUrl }).eq('id', params.id)
          currentReel = { ...currentReel, thumbnail_url: publicUrl }
        }
      } catch { /* Continue without storing */ }
    }

    // Step 1: Basic analysis
    const analysis = await analyzeReel({
      url: currentReel.url,
      author: currentReel.author_username,
      title: currentReel.title,
      description: currentReel.description,
      thumbnailBase64,
      categories: categoryNames,
    })

    // Step 2: Business analysis — if reel contains business-relevant content
    let businessUpdate: Record<string, unknown> = {}
    const shouldAnalyzeBusiness = isBusinessRelevant(
      analysis.category_suggestion?.toLowerCase().replace(/ /g, '-') ?? null,
      analysis.tags,
      currentReel.description,
    )

    if (shouldAnalyzeBusiness) {
      try {
        const businessAnalysis = await analyzeBusinessPotential({
          url: currentReel.url,
          author: currentReel.author_username,
          title: currentReel.title,
          description: currentReel.description,
          basicAnalysis: analysis,
          thumbnailBase64,
        })

        businessUpdate = {
          business_score: businessAnalysis.overall_score ?? 0,
          business_analysis: businessAnalysis,
          is_business_relevant: businessAnalysis.is_relevant ?? false,
        }
      } catch (err) {
        console.error('[Business analyze error]', err)
        // Continue without business analysis — don't fail the whole thing
      }
    }

    const { data: updated, error: updateError } = await supabase
      .from('reels')
      .update({
        gemini_summary: analysis.summary,
        gemini_transcript: analysis.transcript,
        gemini_tags: analysis.tags,
        gemini_category_suggestion: analysis.category_suggestion,
        analysis_status: 'done',
        updated_at: new Date().toISOString(),
        ...businessUpdate,
      })
      .eq('id', params.id)
      .select(REEL_SELECT)
      .single()

    if (updateError) throw updateError
    return NextResponse.json(updated)
  } catch (err) {
    console.error('[Gemini analyze error]', err)
    await supabase.from('reels').update({ analysis_status: 'failed' }).eq('id', params.id)
    return NextResponse.json({ error: 'Analyse fehlgeschlagen' }, { status: 500 })
  }
}
