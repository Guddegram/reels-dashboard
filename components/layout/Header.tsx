'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { SearchBar } from '@/components/dashboard/SearchBar'
import { Plus, Upload, Settings, LogOut, Clapperboard } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface HeaderProps {
  search: string
  onSearchChange: (value: string) => void
  onAddReel: () => void
  onImport: () => void
}

export function Header({ search, onSearchChange, onAddReel, onImport }: HeaderProps) {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email ?? null)
    })
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initials = userEmail ? userEmail[0].toUpperCase() : '?'

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-black/[0.06]">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-sm">
            <Clapperboard className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-semibold text-[15px] tracking-tight text-gray-900">Reels</span>
        </Link>

        {/* Search */}
        <div className="flex-1 max-w-sm">
          <SearchBar value={search} onChange={onSearchChange} />
        </div>

        <div className="flex-1" />

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            onClick={onImport}
            size="sm"
            variant="ghost"
            className="h-8 px-3 text-[13px] text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <Upload className="w-3.5 h-3.5 mr-1.5" />
            Import
          </Button>

          <Link href="/settings">
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-gray-500 hover:text-gray-900 hover:bg-gray-100">
              <Settings className="w-4 h-4" />
            </Button>
          </Link>

          <Button
            onClick={onAddReel}
            size="sm"
            className="h-8 px-3 text-[13px] bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Hinzufügen
          </Button>

          {/* User Avatar + Menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-[12px] font-bold hover:opacity-90 transition-opacity focus:outline-none ring-2 ring-transparent hover:ring-violet-200"
            >
              {initials}
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl border border-gray-100 shadow-xl z-20 overflow-hidden">
                  {userEmail && (
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">Angemeldet als</p>
                      <p className="text-[13px] text-gray-800 font-medium truncate">{userEmail}</p>
                    </div>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-red-600 hover:bg-red-50 transition-colors font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Abmelden
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
