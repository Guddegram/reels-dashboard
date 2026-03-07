import { NextRequest, NextResponse } from 'next/server'
import { adminDb, verifySession } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'
import { cookies } from 'next/headers'

const ALL_DEFAULTS = [
  { name: 'Business Ideas', slug: 'business-ideas', color: '#F59E0B', icon: '💡', sort_order: 1,  type: 'category' },
  { name: 'KI',             slug: 'ki',             color: '#8B5CF6', icon: '🤖', sort_order: 2,  type: 'category' },
  { name: 'Claude',         slug: 'claude',         color: '#6366F1', icon: '🧠', sort_order: 3,  type: 'category' },
  { name: 'Gemini',         slug: 'gemini',         color: '#10B981', icon: '✨', sort_order: 4,  type: 'category' },
  { name: 'OpenAI',         slug: 'openai',         color: '#3B82F6', icon: '⚡', sort_order: 5,  type: 'category' },
  { name: 'Religion',       slug: 'religion',       color: '#F97316', icon: '🌙', sort_order: 6,  type: 'category' },
  { name: 'Sport',          slug: 'sport',          color: '#EF4444', icon: '⚽', sort_order: 7,  type: 'category' },
  { name: 'Lustig',         slug: 'lustig',         color: '#EC4899', icon: '😂', sort_order: 8,  type: 'category' },
  { name: 'Sonstige',       slug: 'sonstige',       color: '#6B7280', icon: '📌', sort_order: 99, type: 'category' },
  { name: 'Guadgram',       slug: 'guadgram',       color: '#06B6D4', icon: '📸', sort_order: 1,  type: 'profile' },
  { name: 'KI Agent hilft', slug: 'ki-agent-hilft', color: '#8B5CF6', icon: '🤖', sort_order: 2,  type: 'profile' },
  { name: 'Elektromeister', slug: 'elektromeister', color: '#F59E0B', icon: '⚡', sort_order: 3,  type: 'profile' },
  { name: 'Avon',           slug: 'avon',           color: '#EC4899', icon: '💄', sort_order: 4,  type: 'profile' },
]

export async function GET() {
  const uid = await verifySession(cookies().get('__session')?.value ?? '')
  if (!uid) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const catsRef = adminDb.collection('users').doc(uid).collection('categories')
  const snap = await catsRef.orderBy('sort_order').get()

  if (snap.empty) {
    // Seed defaults for new user
    const batch = adminDb.batch()
    for (const cat of ALL_DEFAULTS) {
      batch.set(catsRef.doc(), { ...cat, created_at: FieldValue.serverTimestamp() })
    }
    await batch.commit()
    const seeded = await catsRef.orderBy('sort_order').get()
    return NextResponse.json(seeded.docs.map((d) => ({ id: d.id, ...d.data() })))
  }

  const existing = snap.docs.map((d) => ({ id: d.id, ...d.data() as any }))
  const existingSlugs = new Set(existing.map((c) => c.slug))
  const missing = ALL_DEFAULTS.filter((d) => !existingSlugs.has(d.slug))

  if (missing.length > 0) {
    const batch = adminDb.batch()
    for (const cat of missing) {
      batch.set(catsRef.doc(), { ...cat, created_at: FieldValue.serverTimestamp() })
    }
    await batch.commit()
    const updated = await catsRef.orderBy('sort_order').get()
    return NextResponse.json(updated.docs.map((d) => ({ id: d.id, ...d.data() })))
  }

  return NextResponse.json(existing)
}

export async function POST(req: NextRequest) {
  const uid = await verifySession(cookies().get('__session')?.value ?? '')
  if (!uid) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const body = await req.json()
  const slug = body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  const docRef = await adminDb.collection('users').doc(uid).collection('categories').add({
    ...body,
    slug,
    created_at: FieldValue.serverTimestamp(),
  })

  const created = await docRef.get()
  return NextResponse.json({ id: created.id, ...created.data() }, { status: 201 })
}
