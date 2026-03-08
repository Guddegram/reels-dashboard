import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/server'
import { analyzeReel } from '@/lib/gemini/analyze'

const REEL_SELECT = '*, category:categories!reels_category_id_fkey(id,name,slug,color,icon,type), profile:categories!reels_profile_id_fkey(id,name,slug,color,icon,type)'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createRouteClient()
  const { data: { user } } = await supabase.auth.getUser()
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

    let thumbnailBase64: string | null = null
    const thumbUrl = reel.thumbnail_url || reel.external_thumbnail

    if (thumbUrl) {
      try {
        const imgResponse = await fetch(thumbUrl)
        const buffer = await imgResponse.arrayBuffer()
        thumbnailBase64 = Buffer.from(buffer).toString('base64')
      } catch { /* Continue without image */ }
    }

    const analysis = await analyzeReel({
      url: reel.url,
      author: reel.author_username,
      title: reel.title,
      description: reel.description,
      thumbnailBase64,
      categories: categoryNames,
    })

    const { data: updated, error: updateError } = await supabase
      .from('reels')
      .update({
        gemini_summary: analysis.summary,
        gemini_transcript: analysis.transcript,
        gemini_tags: analysis.tags,
        gemini_category_suggestion: analysis.category_suggestion,
        analysis_status: 'done',
        updated_at: new Date().toISOString(),
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
