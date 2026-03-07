'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import type { Category } from '@/types'
import { Trash2, Plus, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function SettingsPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [newProfileName, setNewProfileName] = useState('')
  const [newCatName, setNewCatName] = useState('')
  const [adding, setAdding] = useState<'profile' | 'category' | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchCategories = async () => {
    const res = await fetch('/api/categories')
    const data = await res.json()
    setCategories(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchCategories() }, [])

  const profiles = categories.filter((c) => c.type === 'profile')
  const cats = categories.filter((c) => c.type === 'category')

  const handleAdd = async (type: 'profile' | 'category') => {
    const name = type === 'profile' ? newProfileName.trim() : newCatName.trim()
    if (!name) return
    setAdding(type)
    await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, type }),
    })
    if (type === 'profile') setNewProfileName('')
    else setNewCatName('')
    setAdding(null)
    fetchCategories()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Wirklich löschen? Alle zugewiesenen Reels verlieren diese Zuweisung.')) return
    setDeleting(id)
    await fetch(`/api/categories/${id}`, { method: 'DELETE' })
    setDeleting(null)
    fetchCategories()
  }

  return (
    <div className="min-h-screen bg-background">
      <Header search="" onSearchChange={() => {}} onAddReel={() => {}} onImport={() => {}} />

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-10">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold mb-0.5">Einstellungen</h1>
            <p className="text-sm text-muted-foreground">Profile und Kategorien verwalten</p>
          </div>
        </div>

        {/* Profile */}
        <section className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">Profile</h2>
            {loading ? (
              <p className="text-sm text-muted-foreground">Lade...</p>
            ) : (
              <div className="space-y-2">
                {profiles.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-card border shadow-sm">
                    <span className="text-sm">{p.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7 text-muted-foreground hover:text-destructive"
                      disabled={deleting === p.id}
                      onClick={() => handleDelete(p.id)}
                    >
                      {deleting === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 mt-3">
              <Input
                placeholder="Neues Profil..."
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd('profile')}
                className="h-8 text-sm"
              />
              <Button
                size="sm"
                onClick={() => handleAdd('profile')}
                disabled={!newProfileName.trim() || adding === 'profile'}
                className="h-8"
              >
                {adding === 'profile' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
              </Button>
            </div>
          </div>
        </section>

        {/* Kategorien */}
        <section className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">Kategorien</h2>
            {loading ? (
              <p className="text-sm text-muted-foreground">Lade...</p>
            ) : (
              <div className="space-y-2">
                {cats.map((c) => (
                  <div key={c.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-card border shadow-sm">
                    <span className="text-sm">{c.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7 text-muted-foreground hover:text-destructive"
                      disabled={deleting === c.id}
                      onClick={() => handleDelete(c.id)}
                    >
                      {deleting === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 mt-3">
              <Input
                placeholder="Neue Kategorie..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd('category')}
                className="h-8 text-sm"
              />
              <Button
                size="sm"
                onClick={() => handleAdd('category')}
                disabled={!newCatName.trim() || adding === 'category'}
                className="h-8"
              >
                {adding === 'category' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
