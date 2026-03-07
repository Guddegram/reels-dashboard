import { NextRequest, NextResponse } from 'next/server'
import { createSessionCookie } from '@/lib/firebase/admin'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  const { idToken } = await req.json()

  if (!idToken) {
    return NextResponse.json({ error: 'ID Token fehlt' }, { status: 400 })
  }

  try {
    const sessionCookie = await createSessionCookie(idToken)
    const cookieStore = cookies()

    cookieStore.set('__session', sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 14, // 14 days
      path: '/',
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Session creation error:', e)
    return NextResponse.json({ error: 'Session konnte nicht erstellt werden' }, { status: 500 })
  }
}

export async function DELETE() {
  const cookieStore = cookies()
  cookieStore.delete('__session')
  return NextResponse.json({ success: true })
}
