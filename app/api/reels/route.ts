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

export async function GET(req: NextRequest) {
  const uid = await verifySession(cookies().get('__session')?.value ?? '')
  if (!uid) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const profile = searchParams.get('profile')
  const search = searchParams.get('search')
  const sort = searchParams.get('sort') || 'newest'
  const favorites = searchParams.get('favorites') === 'true'
  const limit = parseInt(searchParams.get('limit') || '200')

  let query: FirebaseFirestore.Query = adminDb
    .collection('users').doc(uid).collection('reels')

  if (favorites) query = query.where('is_favorite', '==', true)
  query = query.orderBy('saved_at', sort === 'oldest' ? 'asc' : 'desc').limit(limit)

  const snap = await query.get()
  let reels = snap.docs.map(toReel)

  // Post-query filters (avoids needing composite indexes for every combination)
  if (category && category !== 'all') reels = reels.filter((r: any) => r.category_slug === category)
  if (profile) {
    reels = reels.filter((r: any) => r.profile_slug === profile)
    const catFilter = searchParams.get('category')
    if (catFilter) reels = reels.filter((r: any) => r.category_slug === catFilter)
  }
  if (search) {
    const q = search.toLowerCase()
    reels = reels.filter((r: any) =>
      r.title?.toLowerCase().includes(q) ||
      r.gemini_summary?.toLowerCase().includes(q) ||
      r.author_username?.toLowerCase().includes(q) ||
      r.gemini_transcript?.toLowerCase().includes(q)
    )
  }

  return NextResponse.json({ reels, total: reels.length })
}

export async function POST(req: NextRequest) {
  const uid = await verifySession(cookies().get('__session')?.value ?? '')
  if (!uid) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const body = await req.json()
  const userRef = adminDb.collection('users').doc(uid)

  let categoryData: Record<string, string | null> = {}
  let profileData: Record<string, string | null> = {}

  if (body.category_id) {
    const snap = await userRef.collection('categories').doc(body.category_id).get()
    if (snap.exists) {
      const c = snap.data()!
      categoryData = { category_name: c.name, category_slug: c.slug, category_color: c.color ?? null, category_icon: c.icon ?? null }
    }
  }
  if (body.profile_id) {
    const snap = await userRef.collection('categories').doc(body.profile_id).get()
    if (snap.exists) {
      const p = snap.data()!
      profileData = { profile_name: p.name, profile_slug: p.slug, profile_color: p.color ?? null, profile_icon: p.icon ?? null }
    }
  }

  const docRef = await userRef.collection('reels').add({
    ...body,
    ...categoryData,
    ...profileData,
    user_id: uid,
    analysis_status: 'pending',
    is_favorite: false,
    saved_at: FieldValue.serverTimestamp(),
    updated_at: FieldValue.serverTimestamp(),
  })

  const created = await docRef.get()
  return NextResponse.json(toReel(created), { status: 201 })
}
