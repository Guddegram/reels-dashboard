'use client'

import { useState, useEffect, useCallback } from 'react'
import { Header } from '@/components/layout/Header'
import { Sidebar, type ActiveFilter } from '@/components/dashboard/Sidebar'
import { ReelCard, ReelCardSkeleton } from '@/components/dashboard/ReelCard'
import { AddReelDialog } from '@/components/dashboard/AddReelDialog'
import { ImportDialog } from '@/components/dashboard/ImportDialog'
import { AnalysisPanel } from '@/components/dashboard/AnalysisPanel'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Reel, Category } from '@/types'
import { Heart, ExternalLink, Pencil, Sparkles, Loader2, Play, ArrowUpDown } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'

export default function DashboardPage() {
  const [reels, setReels] = useState<Reel[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>({ type: 'all' })
  const [sort, setSort] = useState('newest')
  const [addOpen, setAddOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [selectedReel, setSelectedReel] = useState<Reel | null>(null)
  const [analyzingAll, setAnalyzingAll] = useState(false)

  // Edit state
  const [editMode, setEditMode] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editCategoryId, setEditCategoryId] = useState('none')
  const [editProfileId, setEditProfileId] = useState('none')
  const [editSaving, setEditSaving] = useState(false)

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const fetchReels = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()

    if (activeFilter.type === 'category' && activeFilter.slug) {
      params.set('category', activeFilter.slug)
    } else if (activeFilter.type === 'profile' && activeFilter.slug) {
      params.set('profile', activeFilter.slug)
      if (activeFilter.categorySlug) params.set('category', activeFilter.categorySlug)
    } else if (activeFilter.type === 'favorites') {
      params.set('favorites', 'true')
    }

    if (debouncedSearch) params.set('search', debouncedSearch)
    params.set('sort', sort)

    const res = await fetch(`/api/reels?${params}`)
    const data = await res.json()
    setReels(data.reels || [])
    setTotal(data.total || 0)
    setLoading(false)
  }, [activeFilter, debouncedSearch, sort])

  const fetchCategories = async () => {
    const res = await fetch('/api/categories')
    const data = await res.json()
    setCategories(data || [])
  }

  useEffect(() => { fetchCategories() }, [])
  useEffect(() => { fetchReels() }, [fetchReels])

  const handleFavoriteToggle = async (id: string, value: boolean) => {
    await fetch(`/api/reels/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_favorite: value }),
    })
    if (selectedReel?.id === id) setSelectedReel((prev) => prev ? { ...prev, is_favorite: value } : null)
    fetchReels()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Reel wirklich löschen?')) return
    await fetch(`/api/reels/${id}`, { method: 'DELETE' })
    if (selectedReel?.id === id) setSelectedReel(null)
    fetchReels()
  }

  const handleAnalyze = async (id: string) => {
    setReels((prev) => prev.map((r) => (r.id === id ? { ...r, analysis_status: 'processing' as const } : r)))
    if (selectedReel?.id === id) setSelectedReel((prev) => prev ? { ...prev, analysis_status: 'processing' as const } : null)
    const res = await fetch(`/api/reels/${id}/analyze`, { method: 'POST' })
    if (!res.ok) {
      setReels((prev) => prev.map((r) => (r.id === id ? { ...r, analysis_status: 'failed' as const } : r)))
      if (selectedReel?.id === id) setSelectedReel((prev) => prev ? { ...prev, analysis_status: 'failed' as const } : null)
      return
    }
    const updated = await res.json()
    setReels((prev) => prev.map((r) => (r.id === id ? updated : r)))
    if (selectedReel?.id === id) setSelectedReel(updated)
  }

  const openEditMode = (reel: Reel) => {
    setEditTitle(reel.title || '')
    setEditNotes(reel.notes || '')
    setEditCategoryId(reel.category_id || 'none')
    setEditProfileId(reel.profile_id || 'none')
    setEditMode(true)
  }

  const handleEditSave = async () => {
    if (!selectedReel) return
    setEditSaving(true)
    const res = await fetch(`/api/reels/${selectedReel.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: editTitle || null,
        notes: editNotes || null,
        category_id: (editCategoryId && editCategoryId !== 'none') ? editCategoryId : null,
        profile_id: (editProfileId && editProfileId !== 'none') ? editProfileId : null,
      }),
    })
    if (res.ok) {
      const updated = await res.json()
      setSelectedReel(updated)
      setReels((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
    }
    setEditSaving(false)
    setEditMode(false)
  }

  const handleAnalyzeAll = async () => {
    setAnalyzingAll(true)
    const res = await fetch('/api/reels?limit=200&sort=newest')
    const data = await res.json()
    const pending = (data.reels || []).filter(
      (r: Reel) => r.analysis_status === 'pending' || r.analysis_status === 'failed'
    )
    for (const reel of pending) {
      await handleAnalyze(reel.id)
    }
    setAnalyzingAll(false)
  }

  const filterLabel = () => {
    if (activeFilter.type === 'all') return 'Alle Reels'
    if (activeFilter.type === 'favorites') return 'Favoriten'
    const found = categories.find((c) => c.slug === activeFilter.slug)
    const label = found?.name ?? activeFilter.slug ?? ''
    if (activeFilter.categorySlug) {
      const cat = categories.find((c) => c.slug === activeFilter.categorySlug)
      return `${label} · ${cat?.name ?? activeFilter.categorySlug}`
    }
    return label
  }

  const activeProfileId = activeFilter.type === 'profile' && activeFilter.slug
    ? categories.find((c) => c.slug === activeFilter.slug)?.id
    : undefined

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col">
      <Header search={search} onSearchChange={setSearch} onAddReel={() => setAddOpen(true)} onImport={() => setImportOpen(true)} />

      <div className="flex flex-1 max-w-7xl mx-auto w-full px-6">
        {/* Sidebar */}
        <Sidebar
          categories={categories}
          activeFilter={activeFilter}
          total={total}
          onSelect={setActiveFilter}
        />

        {/* Main content */}
        <main className="flex-1 py-6 min-w-0 pl-4">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-[15px] font-semibold text-gray-900">{filterLabel()}</h2>
              <p className="text-[12px] text-gray-400 mt-0.5">{total} Reels</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-gray-600 hover:text-gray-900 hover:bg-white border border-transparent hover:border-gray-200 transition-all disabled:opacity-50"
                onClick={handleAnalyzeAll}
                disabled={analyzingAll}
              >
                {analyzingAll
                  ? <><Loader2 className="w-3 h-3 animate-spin" /> Analysiere...</>
                  : <><Sparkles className="w-3 h-3" /> Alle analysieren</>
                }
              </button>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-36 h-8 text-[12px] bg-white border-gray-200 rounded-lg">
                  <ArrowUpDown className="w-3 h-3 mr-1 text-gray-400" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Neueste zuerst</SelectItem>
                  <SelectItem value="oldest">Älteste zuerst</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {Array.from({ length: 12 }).map((_, i) => <ReelCardSkeleton key={i} />)}
            </div>
          ) : reels.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center mb-4">
                <Play className="w-7 h-7 text-pink-400" />
              </div>
              <h3 className="text-[15px] font-semibold text-gray-900 mb-1">
                {search ? 'Keine Ergebnisse' : 'Noch keine Reels'}
              </h3>
              <p className="text-[13px] text-gray-400 mb-5">
                {search ? 'Versuche andere Suchbegriffe.' : 'Füge deinen ersten Reel hinzu!'}
              </p>
              {!search && (
                <Button
                  onClick={() => setAddOpen(true)}
                  className="h-9 px-4 text-[13px] bg-blue-500 hover:bg-blue-600 text-white rounded-xl"
                >
                  Ersten Reel hinzufügen
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {reels.map((reel) => (
                <ReelCard
                  key={reel.id}
                  reel={reel}
                  onFavoriteToggle={handleFavoriteToggle}
                  onAnalyze={handleAnalyze}
                  onDelete={handleDelete}
                  onClick={setSelectedReel}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Import Dialog */}
      <ImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={fetchReels}
        categories={categories}
      />

      {/* Add Reel Dialog */}
      <AddReelDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        categories={categories}
        onSaved={fetchReels}
        defaultProfileId={activeProfileId}
      />

      {/* Reel Detail Dialog */}
      {selectedReel && (
        <Dialog open={!!selectedReel} onOpenChange={() => { setSelectedReel(null); setEditMode(false) }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 rounded-2xl">
            <div className="flex gap-0 min-h-0">
              {/* Thumbnail column */}
              {(selectedReel.thumbnail_url || selectedReel.external_thumbnail) && (
                <a
                  href={selectedReel.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative flex-shrink-0 w-52 bg-black rounded-l-2xl overflow-hidden group"
                >
                  <img
                    src={selectedReel.thumbnail_url || selectedReel.external_thumbnail!}
                    alt="Thumbnail"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="bg-white/90 rounded-full p-3">
                      <ExternalLink className="w-5 h-5 text-black" />
                    </div>
                  </div>
                </a>
              )}

              {/* Info column */}
              <div className="flex-1 p-6 overflow-y-auto">
                <DialogHeader className="mb-4">
                  <DialogTitle className="text-[17px] font-semibold leading-snug">
                    {selectedReel.title || (selectedReel.author_username ? `@${selectedReel.author_username}` : 'Kein Titel')}
                  </DialogTitle>
                </DialogHeader>

                {/* Meta */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {selectedReel.profile && (
                    <Badge variant="outline" className="text-[11px] rounded-full border-gray-200">
                      {selectedReel.profile.name}
                    </Badge>
                  )}
                  {selectedReel.category && (
                    <Badge variant="secondary" className="text-[11px] rounded-full bg-gray-100 text-gray-600">
                      {selectedReel.category.name}
                    </Badge>
                  )}
                  {selectedReel.author_username && (
                    <span className="text-[12px] text-gray-400">@{selectedReel.author_username}</span>
                  )}
                  <span className="text-[12px] text-gray-400">
                    {selectedReel.saved_at ? new Date(selectedReel.saved_at).toLocaleDateString('de-DE', {
                      day: '2-digit', month: 'long', year: 'numeric'
                    }) : '—'}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-wrap mb-5">
                  <button
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all ${
                      selectedReel.is_favorite
                        ? 'bg-red-50 border-red-200 text-red-600'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                    onClick={() => handleFavoriteToggle(selectedReel.id, !selectedReel.is_favorite)}
                  >
                    <Heart className={`w-3.5 h-3.5 ${selectedReel.is_favorite ? 'fill-red-500 text-red-500' : ''}`} />
                    {selectedReel.is_favorite ? 'Favorit' : 'Favorisieren'}
                  </button>
                  <button
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border border-gray-200 bg-white text-gray-600 hover:border-gray-300 transition-all"
                    onClick={() => window.open(selectedReel.url, '_blank')}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Instagram
                  </button>
                  <button
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border border-gray-200 bg-white text-gray-600 hover:border-gray-300 transition-all"
                    onClick={() => openEditMode(selectedReel)}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Bearbeiten
                  </button>
                </div>

                {/* Edit form */}
                {editMode && (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3 mb-4">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Bearbeiten</p>

                    <div className="space-y-1">
                      <label className="text-[12px] font-medium text-gray-700">Titel</label>
                      <input
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Titel..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[12px] font-medium text-gray-700">Profil</label>
                        <Select value={editProfileId} onValueChange={setEditProfileId}>
                          <SelectTrigger className="h-8 text-[12px] bg-white border-gray-200 rounded-lg">
                            <SelectValue placeholder="Kein Profil" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Kein Profil</SelectItem>
                            {categories.filter((c) => c.type === 'profile').map((p) => (
                              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[12px] font-medium text-gray-700">Kategorie</label>
                        <Select value={editCategoryId} onValueChange={setEditCategoryId}>
                          <SelectTrigger className="h-8 text-[12px] bg-white border-gray-200 rounded-lg">
                            <SelectValue placeholder="Keine Kategorie" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Keine Kategorie</SelectItem>
                            {categories.filter((c) => c.type === 'category').map((c) => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[12px] font-medium text-gray-700">Notizen</label>
                      <Textarea
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        placeholder="Notizen..."
                        rows={2}
                        className="text-[13px] bg-white border-gray-200 rounded-lg resize-none"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleEditSave}
                        disabled={editSaving}
                        className="flex-1 h-8 text-[12px] bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
                      >
                        {editSaving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                        Speichern
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditMode(false)}
                        className="h-8 text-[12px] border-gray-200 rounded-lg"
                      >
                        Abbrechen
                      </Button>
                    </div>
                  </div>
                )}

                {/* Notes read-only */}
                {!editMode && selectedReel.notes && (
                  <div className="mb-4 space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Notizen</p>
                    <p className="text-[13px] leading-relaxed bg-gray-50 border border-gray-100 rounded-xl p-3 text-gray-700">
                      {selectedReel.notes}
                    </p>
                  </div>
                )}

                {/* Gemini Analysis */}
                <AnalysisPanel reel={selectedReel} onAnalyze={handleAnalyze} />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
