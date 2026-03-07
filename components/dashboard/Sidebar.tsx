'use client'

import type { Category } from '@/types'
import { Grid2x2, Heart, User, Tag } from 'lucide-react'

export type ActiveFilter = {
  type: 'all' | 'category' | 'profile' | 'favorites'
  slug?: string
  categorySlug?: string
}

interface SidebarProps {
  categories: Category[]
  activeFilter: ActiveFilter
  total: number
  onSelect: (filter: ActiveFilter) => void
}

export function Sidebar({ categories, activeFilter, total, onSelect }: SidebarProps) {
  const profiles = categories.filter((c) => c.type === 'profile')
  const cats = categories.filter((c) => c.type === 'category')

  const isProfileActive = (slug: string) =>
    activeFilter.type === 'profile' && activeFilter.slug === slug

  const isCatActive = (catSlug: string) =>
    activeFilter.type === 'category' && activeFilter.slug === catSlug

  const isSubCatActive = (profileSlug: string, catSlug: string) =>
    activeFilter.type === 'profile' &&
    activeFilter.slug === profileSlug &&
    activeFilter.categorySlug === catSlug

  return (
    <aside className="w-48 shrink-0 flex flex-col gap-5 py-6 pr-4">
      {/* Allgemein */}
      <div className="space-y-0.5">
        <NavItem
          icon={<Grid2x2 className="w-3.5 h-3.5" />}
          label="Alle Reels"
          count={total}
          active={activeFilter.type === 'all'}
          onClick={() => onSelect({ type: 'all' })}
        />
        <NavItem
          icon={<Heart className="w-3.5 h-3.5" />}
          label="Favoriten"
          active={activeFilter.type === 'favorites'}
          onClick={() => onSelect({ type: 'favorites' })}
        />
      </div>

      {/* Profile */}
      {profiles.length > 0 && (
        <div className="space-y-0.5">
          <SectionLabel icon={<User className="w-3 h-3" />} label="Profile" />
          {profiles.map((p) => (
            <div key={p.id}>
              <NavItem
                label={p.name}
                active={isProfileActive(p.slug) || false}
                onClick={() => onSelect({ type: 'profile', slug: p.slug })}
              />
              {isProfileActive(p.slug) && cats.length > 0 && (
                <div className="mt-0.5 ml-3 space-y-0.5 border-l-2 border-gray-100 pl-2">
                  {cats.map((c) => (
                    <button
                      key={c.id}
                      className={`w-full text-left px-2 py-1 rounded-md text-xs transition-colors cursor-pointer ${
                        isSubCatActive(p.slug, c.slug)
                          ? 'text-blue-600 font-medium'
                          : 'text-gray-400 hover:text-gray-700'
                      }`}
                      onClick={() => onSelect({ type: 'profile', slug: p.slug, categorySlug: c.slug })}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Kategorien */}
      {cats.length > 0 && (
        <div className="space-y-0.5">
          <SectionLabel icon={<Tag className="w-3 h-3" />} label="Kategorien" />
          {cats.map((c) => (
            <NavItem
              key={c.id}
              label={c.name}
              active={isCatActive(c.slug)}
              onClick={() => onSelect({ type: 'category', slug: c.slug })}
            />
          ))}
        </div>
      )}
    </aside>
  )
}

function SectionLabel({ label, icon }: { label: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 px-2 mb-1">
      <span className="text-gray-400">{icon}</span>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{label}</p>
    </div>
  )
}

function NavItem({
  icon,
  label,
  count,
  active,
  onClick,
}: {
  icon?: React.ReactNode
  label: string
  count?: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[13px] transition-all duration-150 flex items-center gap-2 cursor-pointer ${
        active
          ? 'bg-blue-50 text-blue-600 font-medium'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
      }`}
      onClick={onClick}
    >
      {icon && (
        <span className={active ? 'text-blue-500' : 'text-gray-400'}>{icon}</span>
      )}
      <span className="flex-1">{label}</span>
      {count !== undefined && (
        <span className={`text-[11px] tabular-nums ${active ? 'text-blue-400' : 'text-gray-400'}`}>
          {count}
        </span>
      )}
    </button>
  )
}
