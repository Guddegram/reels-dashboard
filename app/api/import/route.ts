import { NextRequest, NextResponse } from 'next/server'
import { adminDb, verifySession } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'
import { cookies } from 'next/headers'

interface InstagramSavedPost {
  string_map_data: { 'Saved on': { href: string; timestamp: number } }
}

export async function POST(req: NextRequest) {
  const uid = await verifySession(cookies().get('__session')?.value ?? '')
  if (!uid) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  try {
    const body = await req.json()
    let urls: { url: string; savedAt?: number }[] = []

    if (Array.isArray(body)) {
      urls = body.map((u: string) => ({ url: u }))
    } else if (body.saved_saved_media) {
      urls = (body.saved_saved_media as InstagramSavedPost[])
        .map((item) => ({
          url: item.string_map_data?.['Saved on']?.href,
          savedAt: item.string_map_data?.['Saved on']?.timestamp,
        }))
        .filter((item) => item.url?.includes('instagram.com'))
    } else if (body.url) {
      urls = [{ url: body.url }]
    } else {
      return NextResponse.json({ error: 'Ungültiges Format' }, { status: 400 })
    }

    if (urls.length === 0) return NextResponse.json({ error: 'Keine Instagram-URLs gefunden' }, { status: 400 })

    // Check existing URLs
    const reelsRef = adminDb.collection('users').doc(uid).collection('reels')
    const existingSnap = await reelsRef.select('url').get()
    const existingUrls = new Set(existingSnap.docs.map((d) => d.data().url))

    const newUrls = urls.filter((u) => !existingUrls.has(u.url))

    if (newUrls.length === 0) {
      return NextResponse.json({ imported: 0, skipped: urls.length, message: 'Alle URLs bereits vorhanden' })
    }

    // Batch insert (Firestore max 500 per batch)
    const chunks = []
    for (let i = 0; i < newUrls.length; i += 499) chunks.push(newUrls.slice(i, i + 499))

    for (const chunk of chunks) {
      const batch = adminDb.batch()
      for (const item of chunk) {
        batch.set(reelsRef.doc(), {
          url: item.url,
          user_id: uid,
          analysis_status: 'pending',
          is_favorite: false,
          saved_at: item.savedAt
            ? new Date(item.savedAt * 1000)
            : FieldValue.serverTimestamp(),
          updated_at: FieldValue.serverTimestamp(),
        })
      }
      await batch.commit()
    }

    return NextResponse.json({ imported: newUrls.length, skipped: existingUrls.size, total: urls.length })
  } catch (err) {
    console.error('[import error]', err)
    return NextResponse.json({ error: 'Import fehlgeschlagen' }, { status: 500 })
  }
}
