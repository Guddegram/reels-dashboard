import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import { exchangeCodeForToken, getFacebookUser } from '@/lib/instagram/oauth'
import { FieldValue } from 'firebase-admin/firestore'

const ALL_DEFAULTS = [
  { name: 'Business Ideas', slug: 'business-ideas', color: '#F59E0B', icon: '💡', sort_order: 1, type: 'category' },
  { name: 'KI',             slug: 'ki',             color: '#8B5CF6', icon: '🤖', sort_order: 2, type: 'category' },
  { name: 'Claude',         slug: 'claude',         color: '#6366F1', icon: '🧠', sort_order: 3, type: 'category' },
  { name: 'Gemini',         slug: 'gemini',         color: '#10B981', icon: '✨', sort_order: 4, type: 'category' },
  { name: 'OpenAI',         slug: 'openai',         color: '#3B82F6', icon: '⚡', sort_order: 5, type: 'category' },
  { name: 'Religion',       slug: 'religion',       color: '#F97316', icon: '🌙', sort_order: 6, type: 'category' },
  { name: 'Sport',          slug: 'sport',          color: '#EF4444', icon: '⚽', sort_order: 7, type: 'category' },
  { name: 'Lustig',         slug: 'lustig',         color: '#EC4899', icon: '😂', sort_order: 8, type: 'category' },
  { name: 'Sonstige',       slug: 'sonstige',       color: '#6B7280', icon: '📌', sort_order: 99, type: 'category' },
  { name: 'Guadgram',       slug: 'guadgram',       color: '#06B6D4', icon: '📸', sort_order: 1, type: 'profile' },
  { name: 'KI Agent hilft', slug: 'ki-agent-hilft', color: '#8B5CF6', icon: '🤖', sort_order: 2, type: 'profile' },
  { name: 'Elektromeister', slug: 'elektromeister', color: '#F59E0B', icon: '⚡', sort_order: 3, type: 'profile' },
  { name: 'Avon',           slug: 'avon',           color: '#EC4899', icon: '💄', sort_order: 4, type: 'profile' },
]

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  if (!code) {
    return NextResponse.redirect(`${appUrl}/login?error=no_code`)
  }

  try {
    const { access_token } = await exchangeCodeForToken(code)
    const fbUser = await getFacebookUser(access_token)

    const uid = `fb_${fbUser.id}`

    // Create Firebase user if not exists
    try {
      await adminAuth.getUser(uid)
    } catch {
      await adminAuth.createUser({ uid, displayName: fbUser.name })
    }

    // Save user profile in Firestore
    const userRef = adminDb.collection('users').doc(uid)
    const userSnap = await userRef.get()

    await userRef.set({
      instagram_id: fbUser.id,
      username: fbUser.name,
      access_token,
      updated_at: FieldValue.serverTimestamp(),
    }, { merge: true })

    // Seed default categories for new users
    if (!userSnap.exists) {
      const batch = adminDb.batch()
      for (const cat of ALL_DEFAULTS) {
        const catRef = userRef.collection('categories').doc()
        batch.set(catRef, { ...cat, created_at: FieldValue.serverTimestamp() })
      }
      await batch.commit()
    }

    // Create custom token → redirect to exchange page for session creation
    const customToken = await adminAuth.createCustomToken(uid)
    return NextResponse.redirect(`${appUrl}/auth/exchange?ct=${encodeURIComponent(customToken)}`)
  } catch (e) {
    console.error('Auth callback error:', e)
    return NextResponse.redirect(`${appUrl}/login?error=auth_failed`)
  }
}
