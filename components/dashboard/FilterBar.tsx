'use client'

import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Category } from '@/types'

interface FilterBarProps {
  categories: Category[]
  activeCategory: string
  sort: string
  total: number
  onCategoryChange: (slug: string) => void
  onSortChange: (sort: string) => void
}

export function FilterBar({
  categories,
  activeCategory,
  sort,
  total,
  onCategoryChange,
  onSortChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* All pill */}
      <Button
        variant={activeCategory === 'all' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onCategoryChange('all')}
        className="rounded-full"
      >
        Alle {activeCategory === 'all' && <span className="ml-1 text-xs opacity-70">({total})</span>}
      </Button>

      {/* Category pills */}
      {categories.map((cat) => (
        <Button
          key={cat.id}
          variant={activeCategory === cat.slug ? 'default' : 'outline'}
          size="sm"
          onClick={() => onCategoryChange(cat.slug)}
          className="rounded-full"
          style={
            activeCategory === cat.slug
              ? { backgroundColor: cat.color, borderColor: cat.color }
              : { borderColor: cat.color + '60', color: cat.color }
          }
        >
          {cat.icon} {cat.name}
        </Button>
      ))}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Sort */}
      <Select value={sort} onValueChange={onSortChange}>
        <SelectTrigger className="w-44 h-8 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Neueste zuerst</SelectItem>
          <SelectItem value="oldest">Älteste zuerst</SelectItem>
          <SelectItem value="favorites">Nur Favoriten</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
