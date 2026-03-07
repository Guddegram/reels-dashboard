import { Button } from '@/components/ui/button'
import { Instagram } from 'lucide-react'

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  const errorMessages: Record<string, string> = {
    no_code: 'Anmeldung abgebrochen.',
    signup_failed: 'Registrierung fehlgeschlagen. Bitte erneut versuchen.',
    auth_failed: 'Anmeldung fehlgeschlagen. Bitte erneut versuchen.',
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-950 via-pink-950 to-orange-950">
      <div className="bg-background rounded-2xl p-8 shadow-2xl max-w-sm w-full mx-4 space-y-6 text-center">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center">
            <Instagram className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Reels Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Speichere und kategorisiere deine Instagram Reels. Gemini analysiert den Inhalt automatisch.
          </p>
        </div>

        {/* Error */}
        {searchParams.error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-500">
            {errorMessages[searchParams.error] || 'Ein Fehler ist aufgetreten.'}
          </div>
        )}

        {/* Login Button */}
        <a href="/api/auth/instagram">
          <Button
            className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 hover:opacity-90 text-white border-0"
            size="lg"
          >
            <Instagram className="w-4 h-4 mr-2" />
            Mit Instagram anmelden
          </Button>
        </a>

        <p className="text-xs text-muted-foreground">
          Nur dein Benutzername wird gespeichert. Keine Daten werden geteilt.
        </p>
      </div>
    </div>
  )
}
