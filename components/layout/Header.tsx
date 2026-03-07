'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { SearchBar } from '@/components/dashboard/SearchBar'
import { Plus, Upload, Settings, Play } from 'lucide-react'

interface HeaderProps {
  search: string
  onSearchChange: (value: string) => void
  onAddReel: () => void
  onImport: () => void
}

export function Header({ search, onSearchChange, onAddReel, onImport }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-black/[0.06]">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-500 via-rose-500 to-orange-400 flex items-center justify-center shadow-sm">
            <Play className="w-3.5 h-3.5 text-white fill-white" />
          </div>
          <span className="font-semibold text-[15px] tracking-tight text-gray-900">Reels</span>
        </div>

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
        </div>
      </div>
    </header>
  )
}
