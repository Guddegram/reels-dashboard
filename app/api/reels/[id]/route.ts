import { NextRequest, NextResponse } from 'next/server'
import { adminDb, verifySession } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'
import { cookies } from 'next/headers'

function toReel(doc: FirebaseFirestore.DocumentSnapshot) {
  const d = doc.data()!
  return {
    id: doc.id,
    ...d,
    saved_at: d.saved_at?.toDate?.()?.toISOString() ?? d.saved_at ?? new Date().toISOString(),
    updated_at: d.updated_at?.toDate?.()?.toISOString() ?? d.updated_at ?? new Date().toISOString(),
    category: d.category_id ? {
      id: d.category_id, name: d.category_name ?? null, slug: d.category_slug ?? null,
      color: d.category_color ?? null, icon: d.category_icon ?? null, type: 'category',
    } : null,
    profile: d.profile_id ? {
      id: d.profile_id, name: d.profile_name ?? null, slug: d.profile_slug ?? null,
      color: d.profile_color ?? null, icon: d.profile_icon ?? null, type: 'profile',
    } : null,
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const uid = await verifySession(cookies().get('__session')?.value ?? '')
  if (!uid) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const doc = await adminDb.collection('users').doc(uid).collection('reels').doc(params.id).get()
  if (!doc.exists) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  return NextResponse.json(toReel(doc))
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const uid = await verifySession(cookies().get('__session')?.value ?? '')
  if (!uid) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const body = await req.json()
  const userRef = adminDb.collection('users').doc(uid)
  const reelRef = userRef.collection('reels').doc(params.id)

  // Resolve category/profile names if IDs changed
  let categoryData: Record<string, string | null> = {}
  let profileData: Record<string, string | null> = {}

  if ('category_id' in body) {
    if (body.category_id) {
      const snap = await userRef.collection('categories').doc(body.category_id).get()
      if (snap.exists) {
        const c = snap.data()!
        categoryData = { category_name: c.name, category_slug: c.slug, category_color: c.color ?? null, category_icon: c.icon ?? null }
      }
    } else {
      categoryData = { category_name: null, category_slug: null, category_color: null, category_icon: null }
    }
  }
  if ('profile_id' in body) {
    if (body.profile_id) {
      const snap = await userRef.collection('categories').doc(body.profile_id).get()
      if (snap.exists) {
        const p = snap.data()!
        profileData = { profile_name: p.name, profile_slug: p.slug, profile_color: p.color ?? null, profile_icon: p.icon ?? null }
      }
    } else {
      profileData = { profile_name: null, profile_slug: null, profile_color: null, profile_icon: null }
    }
  }

  await reelRef.update({
    ...body,
    ...categoryData,
    ...profileData,
    updated_at: FieldValue.serverTimestamp(),
  })

  const updated = await reelRef.get()
  return NextResponse.json(toReel(updated))
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const uid = await verifySession(cookies().get('__session')?.value ?? '')
  if (!uid) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const reelRef = adminDb.collection('users').doc(uid).collection('reels').doc(params.id)
  const reel = await reelRef.get()

  if (reel.exists) {
    // Delete thumbnail from Firebase Storage if stored there
    const thumbUrl = reel.data()?.thumbnail_url
    if (thumbUrl && thumbUrl.includes('firebasestorage')) {
      try {
        const { getStorage } = await import('firebase-admin/storage')
        const bucket = getStorage().bucket()
        const path = thumbUrl.split('/o/')[1]?.split('?')[0]
        if (path) await bucket.file(decodeURIComponent(path)).delete()
      } catch { /* ignore storage errors */ }
    }
    await reelRef.delete()
  }

  return NextResponse.json({ success: true })
}
