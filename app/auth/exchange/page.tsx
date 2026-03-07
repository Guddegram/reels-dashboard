'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signInWithCustomToken } from 'firebase/auth'
import { auth } from '@/lib/firebase/config'
import { Loader2 } from 'lucide-react'

export default function AuthExchangePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const customToken = searchParams.get('ct')
    if (!customToken) {
      router.replace('/login?error=no_token')
      return
    }

    async function exchange() {
      try {
        // Sign in with custom token → get ID token
        const userCred = await signInWithCustomToken(auth, customToken!)
        const idToken = await userCred.user.getIdToken()

        // Exchange ID token for session cookie (server-side)
        const res = await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        })

        if (!res.ok) throw new Error('Session creation failed')

        router.replace('/')
      } catch (e) {
        console.error('Auth exchange error:', e)
        setError('Anmeldung fehlgeschlagen. Bitte versuche es erneut.')
      }
    }

    exchange()
  }, [searchParams, router])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7]">
        <div className="text-center space-y-4">
          <p className="text-red-500 text-sm">{error}</p>
          <a href="/login" className="text-blue-500 text-sm underline">Zurück zum Login</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        <p className="text-sm text-gray-500">Anmeldung wird abgeschlossen...</p>
      </div>
    </div>
  )
}
