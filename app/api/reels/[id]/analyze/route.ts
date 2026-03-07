import { NextRequest, NextResponse } from 'next/server'
import { adminDb, verifySession } from '@/lib/firebase/admin'
import { analyzeReel } from '@/lib/gemini/analyze'
import { FieldValue } from 'firebase-admin/firestore'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const uid = await verifySession(cookies().get('__session')?.value ?? '')
  if (!uid) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const reelRef = adminDb.collection('users').doc(uid).collection('reels').doc(params.id)
  const reelSnap = await reelRef.get()

  if (!reelSnap.exists) return NextResponse.json({ error: 'Reel nicht gefunden' }, { status: 404 })

  const reel = reelSnap.data()!

  await reelRef.update({ analysis_status: 'processing' })

  try {
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
    })

    await reelRef.update({
      gemini_summary: analysis.summary,
      gemini_transcript: analysis.transcript,
      gemini_tags: analysis.tags,
      gemini_category_suggestion: analysis.category_suggestion,
      analysis_status: 'done',
      updated_at: FieldValue.serverTimestamp(),
    })

    const updated = await reelRef.get()
    const d = updated.data()!
    return NextResponse.json({
      id: updated.id,
      ...d,
      saved_at: d.saved_at?.toDate?.()?.toISOString() ?? d.saved_at,
      updated_at: d.updated_at?.toDate?.()?.toISOString() ?? d.updated_at,
      category: d.category_id ? {
        id: d.category_id, name: d.category_name ?? null, slug: d.category_slug ?? null,
        color: d.category_color ?? null, icon: d.category_icon ?? null, type: 'category',
      } : null,
      profile: d.profile_id ? {
        id: d.profile_id, name: d.profile_name ?? null, slug: d.profile_slug ?? null,
        color: d.profile_color ?? null, icon: d.profile_icon ?? null, type: 'profile',
      } : null,
    })
  } catch (err) {
    console.error('[Gemini analyze error]', err)
    await reelRef.update({ analysis_status: 'failed' })
    return NextResponse.json({ error: 'Analyse fehlgeschlagen' }, { status: 500 })
  }
}
