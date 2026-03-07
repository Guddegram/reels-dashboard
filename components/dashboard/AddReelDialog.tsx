'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import type { Category, ExtractedMetadata } from '@/types'
import { Loader2, Link, CheckCircle } from 'lucide-react'

interface AddReelDialogProps {
  open: boolean
  onClose: () => void
  categories: Category[]
  onSaved: () => void
  defaultProfileId?: string
}

type Step = 'url' | 'preview' | 'saving'

export function AddReelDialog({ open, onClose, categories, onSaved, defaultProfileId }: AddReelDialogProps) {
  const [step, setStep] = useState<Step>('url')
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [metadata, setMetadata] = useState<ExtractedMetadata | null>(null)
  const [categoryId, setCategoryId] = useState('')
  const [profileId, setProfileId] = useState('')
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')

  // Pre-fill profile when dialog opens with an active profile
  useEffect(() => {
    if (open && defaultProfileId) setProfileId(defaultProfileId)
  }, [open, defaultProfileId])

  const reset = () => {
    setStep('url')
    setUrl('')
    setLoading(false)
    setError('')
    setMetadata(null)
    setCategoryId('')
    setProfileId('')
    setTitle('')
    setNotes('')
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleExtract = async () => {
    if (!url.trim()) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      setMetadata(data)
      setTitle(data.title || '')
      setStep('preview')
    } catch (e: any) {
      setError(e.message || 'Extraktion fehlgeschlagen')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setStep('saving')

    try {
      const res = await fetch('/api/reels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          instagram_id: metadata?.instagram_id,
          title: title || null,
          author_username: metadata?.author_username,
          author_name: metadata?.author_name,
          external_thumbnail: metadata?.external_thumbnail,
          description: metadata?.description,
          category_id: categoryId || null,
          profile_id: profileId || null,
          notes: notes || null,
        }),
      })

      if (!res.ok) throw new Error('Speichern fehlgeschlagen')

      onSaved()
      handleClose()
    } catch {
      setError('Speichern fehlgeschlagen')
      setStep('preview')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 'url' && 'Reel hinzufügen'}
            {step === 'preview' && 'Vorschau & Kategorie'}
            {step === 'saving' && 'Wird gespeichert...'}
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: URL */}
        {step === 'url' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="https://www.instagram.com/reel/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleExtract()}
                autoFocus
              />
              <Button onClick={handleExtract} disabled={loading || !url.trim()}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link className="w-4 h-4" />}
              </Button>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <p className="text-xs text-muted-foreground">
              Kopiere den Link eines Instagram Reels und füge ihn hier ein.
            </p>
          </div>
        )}

        {/* Step 2: Preview */}
        {step === 'preview' && metadata && (
          <div className="space-y-4">
            {/* Thumbnail preview */}
            {metadata.external_thumbnail ? (
              <img
                src={metadata.external_thumbnail}
                alt="Thumbnail"
                className="w-full aspect-video object-cover rounded-lg"
              />
            ) : (
              <div className="w-full aspect-video bg-zinc-900 rounded-lg flex items-center justify-center text-xs text-zinc-600">
                Kein Vorschaubild
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              @{metadata.author_username || 'unbekannt'}
            </p>

            {/* Title input */}
            <div className="space-y-1">
              <label className="text-xs font-medium">Titel (optional)</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Eigenen Titel vergeben..."
              />
            </div>

            {/* Profil */}
            <div className="space-y-1">
              <label className="text-xs font-medium">Profil</label>
              <Select value={profileId} onValueChange={setProfileId}>
                <SelectTrigger>
                  <SelectValue placeholder="Profil auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.filter((c) => c.type === 'profile').map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Kategorie */}
            <div className="space-y-1">
              <label className="text-xs font-medium">Kategorie</label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Kategorie auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.filter((c) => c.type === 'category').map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <label className="text-xs font-medium">Notizen (optional)</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Eigene Notizen zum Reel..."
                rows={2}
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('url')} className="flex-1">
                Zurück
              </Button>
              <Button onClick={handleSave} className="flex-1">
                Speichern
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Saving */}
        {step === 'saving' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Reel wird gespeichert...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
