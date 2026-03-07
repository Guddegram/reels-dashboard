'use client'

import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

interface ImportDialogProps {
  open: boolean
  onClose: () => void
  onImported: () => void
}

export function ImportDialog({ open, onClose, onImported }: ImportDialogProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [result, setResult] = useState<{ imported: number; skipped: number; total: number } | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setStatus('loading')
    setErrorMsg('')

    try {
      const text = await file.text()
      const json = JSON.parse(text)

      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(json),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.error || 'Import fehlgeschlagen')
        setStatus('error')
        return
      }

      setResult(data)
      setStatus('success')
      onImported()
    } catch {
      setErrorMsg('Ungültige JSON-Datei')
      setStatus('error')
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const reset = () => {
    setStatus('idle')
    setResult(null)
    setErrorMsg('')
  }

  return (
    <Dialog open={open} onOpenChange={() => { reset(); onClose() }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>📥 Instagram Export importieren</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Instructions */}
          <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
            <p className="font-medium">So exportierst du deine gespeicherten Reels:</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Instagram App öffnen</li>
              <li>Profil → Einstellungen → Deine Aktivität</li>
              <li><strong>Informationen herunterladen</strong> → Anfrage stellen</li>
              <li>Format: <strong>JSON</strong> auswählen</li>
              <li>Datei herunterladen → <code className="bg-background px-1 rounded">saved_posts.json</code> hier hochladen</li>
            </ol>
          </div>

          {/* Upload area */}
          {status === 'idle' && (
            <div
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => inputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
              <p className="font-medium">saved_posts.json hier ablegen</p>
              <p className="text-sm text-muted-foreground mt-1">oder klicken zum Auswählen</p>
              <input
                ref={inputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
              />
            </div>
          )}

          {/* Loading */}
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Reels werden importiert...</p>
            </div>
          )}

          {/* Success */}
          {status === 'success' && result && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-green-500">Import erfolgreich!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    <strong>{result.imported}</strong> neue Reels importiert
                    {result.skipped > 0 && `, ${result.skipped} bereits vorhanden übersprungen`}
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Die Reels sind jetzt im Dashboard. Klicke auf einzelne Karten um Gemini die Analyse zu starten.
              </p>
              <Button onClick={() => { reset(); onClose() }} className="w-full">
                Fertig
              </Button>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-red-500">Import fehlgeschlagen</p>
                  <p className="text-sm text-muted-foreground mt-1">{errorMsg}</p>
                </div>
              </div>
              <Button variant="outline" onClick={reset} className="w-full">
                Erneut versuchen
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
