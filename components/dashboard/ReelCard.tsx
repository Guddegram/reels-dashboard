'use client'

import { useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import type { Reel } from '@/types'
import { Heart, Sparkles, ExternalLink, Trash2, Play, Check } from 'lucide-react'

interface ReelCardProps {
  reel: Reel
  onFavoriteToggle: (id: string, value: boolean) => void
  onAnalyze: (id: string) => void
  onDelete: (id: string) => void
  onClick: (reel: Reel) => void
  selectMode?: boolean
  selected?: boolean
  onSelect?: (id: string) => void
}

export function ReelCard({ reel, onFavoriteToggle, onAnalyze, onDelete, onClick, selectMode, selected, onSelect }: ReelCardProps) {
  const [imgError, setImgError] = useState(false)
  const rawThumbnail = reel.thumbnail_url || reel.external_thumbnail
  const thumbnail = rawThumbnail && !reel.thumbnail_url ? `/api/thumbnail?url=${encodeURIComponent(rawThumbnail)}` : rawThumbnail

  const handleClick = () => {
    if (selectMode) {
      onSelect?.(reel.id)
    } else {
      onClick(reel)
    }
  }

  return (
    <div
      className={`group relative rounded-2xl overflow-hidden cursor-pointer bg-gray-100 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 ${selected ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}
      onClick={handleClick}
    >
      {/* Thumbnail 9:16 */}
      <div className="relative aspect-[9/16] overflow-hidden bg-gray-200">
        {thumbnail && !imgError ? (
          <img
            src={thumbnail}
            alt={reel.title || 'Reel'}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-400">
            <Play className="w-8 h-8 opacity-30" />
            <span className="text-[11px]">Kein Vorschaubild</span>
          </div>
        )}

        {/* Gradient overlay bottom */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

        {/* Select checkbox (top-left) */}
        {selectMode && (
          <div className="absolute top-2 left-2 z-10">
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selected ? 'bg-blue-500 border-blue-500' : 'bg-white/30 border-white/70 backdrop-blur-sm'}`}>
              {selected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
            </div>
          </div>
        )}

        {/* Top-right hover actions (hidden in select mode) */}
        {!selectMode && (
          <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            <ActionBtn
              onClick={(e) => { e.stopPropagation(); onFavoriteToggle(reel.id, !reel.is_favorite) }}
              active={reel.is_favorite}
              title="Favorit"
            >
              <Heart className={`w-3.5 h-3.5 ${reel.is_favorite ? 'fill-red-500 text-red-500' : 'text-white'}`} />
            </ActionBtn>
            <ActionBtn
              onClick={(e) => { e.stopPropagation(); window.open(reel.url, '_blank') }}
              title="Instagram öffnen"
            >
              <ExternalLink className="w-3.5 h-3.5 text-white" />
            </ActionBtn>
            <ActionBtn
              onClick={(e) => { e.stopPropagation(); onDelete(reel.id) }}
              danger
              title="Löschen"
            >
              <Trash2 className="w-3.5 h-3.5 text-white" />
            </ActionBtn>
          </div>
        )}

        {/* Favorite indicator (always visible, not in select mode) */}
        {reel.is_favorite && !selectMode && (
          <div className="absolute top-2 left-2">
            <Heart className="w-4 h-4 fill-red-500 text-red-500 drop-shadow-sm" />
          </div>
        )}

        {/* Business score badge */}
        {!selectMode && reel.is_business_relevant && (reel.business_score ?? 0) >= 7 && (
          <div className="absolute top-2 left-2">
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-400/90 text-amber-900 backdrop-blur-sm">
              💡 {reel.business_score}/10
            </span>
          </div>
        )}

        {/* Status badge bottom-left */}
        {reel.analysis_status !== 'done' && (
          <div className="absolute bottom-2 left-2">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium backdrop-blur-sm ${
              reel.analysis_status === 'failed'
                ? 'bg-red-500/80 text-white'
                : reel.analysis_status === 'processing'
                ? 'bg-blue-500/80 text-white'
                : 'bg-black/50 text-white/90'
            }`}>
              {reel.analysis_status === 'processing' && (
                <Sparkles className="w-2.5 h-2.5 animate-spin" />
              )}
              {reel.analysis_status === 'pending' && 'Nicht analysiert'}
              {reel.analysis_status === 'processing' && 'Analysiere...'}
              {reel.analysis_status === 'failed' && 'Fehler'}
            </span>
          </div>
        )}

        {/* Category badge bottom-right */}
        {reel.category && (
          <div className="absolute bottom-2 right-2">
            <span className="inline-block px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-white/20 backdrop-blur-sm text-white">
              {reel.category.name}
            </span>
          </div>
        )}
      </div>

      {/* Info section */}
      <div className="p-2.5 bg-white">
        <p className="text-[12px] font-medium text-gray-900 line-clamp-2 leading-snug mb-1">
          {reel.title || reel.gemini_summary || reel.author_username || 'Kein Titel'}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-gray-400">@{reel.author_username || '—'}</span>
          {!selectMode && (reel.analysis_status === 'pending' || reel.analysis_status === 'failed') && (
            <button
              className="flex items-center gap-0.5 text-[10px] text-blue-500 hover:text-blue-700 font-medium transition-colors"
              onClick={(e) => { e.stopPropagation(); onAnalyze(reel.id) }}
            >
              <Sparkles className="w-2.5 h-2.5" />
              Analyse
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function ActionBtn({
  children,
  onClick,
  active,
  danger,
  title,
}: {
  children: React.ReactNode
  onClick: (e: React.MouseEvent) => void
  active?: boolean
  danger?: boolean
  title?: string
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-sm transition-all duration-150 ${
        danger
          ? 'bg-red-500/80 hover:bg-red-600'
          : active
          ? 'bg-white/30 hover:bg-white/40'
          : 'bg-black/40 hover:bg-black/60'
      }`}
    >
      {children}
    </button>
  )
}

export function ReelCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden bg-white shadow-sm">
      <Skeleton className="aspect-[9/16] w-full rounded-none" />
      <div className="p-2.5 space-y-1.5">
        <Skeleton className="h-3 w-full rounded-md" />
        <Skeleton className="h-3 w-2/3 rounded-md" />
        <Skeleton className="h-2.5 w-1/2 rounded-md mt-1" />
      </div>
    </div>
  )
}
