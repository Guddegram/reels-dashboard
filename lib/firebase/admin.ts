import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'

function initAdmin() {
  if (getApps().length > 0) return getApps()[0]

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  })
}

initAdmin()

export const adminAuth = getAuth()
export const adminDb = getFirestore()
export const adminStorage = getStorage()

/** Verify session cookie → returns uid or null */
export async function verifySession(cookie: string): Promise<string | null> {
  try {
    const decoded = await adminAuth.verifySessionCookie(cookie, true)
    return decoded.uid
  } catch {
    return null
  }
}

/** Create session cookie from ID token (2 weeks) */
export async function createSessionCookie(idToken: string): Promise<string> {
  const expiresIn = 60 * 60 * 24 * 14 * 1000 // 14 days
  return adminAuth.createSessionCookie(idToken, { expiresIn })
}
