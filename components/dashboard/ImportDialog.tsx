'use client'

import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import type { Category } from '@/types'

interface ImportDialogProps {
  open: boolean
  onClose: () => void
  onImported: () => void
  categories: Category[]
}

export function ImportDialog({ open, onClose, onImported, categories }: ImportDialogProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [result, setResult] = useState<{ imported: number; skipped: number; total: number } | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [profileId, setProfileId] = useState('none')
  const inputRef = useRef<HTMLInputElement>(null)

  const profiles = categories.filter((c) => c.type === 'profile')

  const parseCsv = (text: string): string[] => {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
    const urls: string[] = []
    for (const line of lines) {
      const match = line.match(/https?:\/\/(?:www\.)?instagram\.com\/[^\s,"']+/)
      if (match) urls.push(match[0])
    }
    return urls
  }

  const handleFile = async (file: File) => {
    setStatus('loading')
    setErrorMsg('')

    try {
      const text = await file.text()
      let body: unknown

      if (file.name.endsWith('.csv') || file.type === 'text/csv') {
        const urls = parseCsv(text)
        if (urls.length === 0) {
          setErrorMsg('Keine Instagram-URLs in der CSV-Datei gefunden')
          setStatus('error')
          return
        }
        body = urls
      } else {
        try {
          body = JSON.parse(text)
        } catch {
          setErrorMsg('Ungültige JSON-Datei. Bitte eine gültige JSON oder CSV Datei hochladen.')
          setStatus('error')
          return
        }
      }

      const params = new URLSearchParams()
      if (profileId && profileId !== 'none') params.set('profile_id', profileId)

      const res = await fetch(`/api/import?${params}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
      setErrorMsg('Datei konnte nicht gelesen werden')
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

          {/* Profile selector */}
          {status === 'idle' && profiles.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-gray-700">Profil zuweisen (optional)</label>
              <Select value={profileId} onValueChange={setProfileId}>
                <SelectTrigger className="h-9 text-sm bg-white border-gray-200 rounded-lg">
                  <SelectValue placeholder="Kein Profil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Kein Profil</SelectItem>
                  {profiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.icon} {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Upload area */}
          {status === 'idle' && (
            <div
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => inputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
              <p className="font-medium">JSON oder CSV hier ablegen</p>
              <p className="text-sm text-muted-foreground mt-1">oder klicken zum Auswählen</p>
              <p className="text-xs text-muted-foreground mt-2 opacity-70">Unterstützt: saved_posts.json · CSV mit Instagram-URLs</p>
              <input
                ref={inputRef}
                type="file"
                accept=".json,.csv"
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
                Die Reels werden automatisch analysiert — das kann ein paar Minuten dauern.
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
