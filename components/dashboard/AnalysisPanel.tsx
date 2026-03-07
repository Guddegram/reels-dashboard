'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { Reel } from '@/types'
import { Sparkles, ChevronDown, ChevronUp, Loader2, RefreshCw } from 'lucide-react'

interface AnalysisPanelProps {
  reel: Reel
  onAnalyze: (id: string) => Promise<void>
}

export function AnalysisPanel({ reel, onAnalyze }: AnalysisPanelProps) {
  const [transcriptOpen, setTranscriptOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleAnalyze = async () => {
    setLoading(true)
    await onAnalyze(reel.id)
    setLoading(false)
  }

  if (reel.analysis_status === 'pending' || reel.analysis_status === 'failed') {
    return (
      <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-purple-100 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
          </div>
          <h3 className="text-[13px] font-semibold text-gray-900">KI-Analyse</h3>
        </div>
        <p className="text-[12px] text-gray-500 leading-relaxed">
          {reel.analysis_status === 'failed'
            ? 'Die Analyse ist fehlgeschlagen. Versuche es erneut.'
            : 'Dieser Reel wurde noch nicht analysiert.'}
        </p>
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 h-8 rounded-lg bg-purple-500 hover:bg-purple-600 text-white text-[12px] font-medium transition-colors disabled:opacity-60"
        >
          {loading ? (
            <><Loader2 className="w-3 h-3 animate-spin" /> Analysiere...</>
          ) : (
            <><Sparkles className="w-3 h-3" /> Jetzt analysieren</>
          )}
        </button>
      </div>
    )
  }

  if (reel.analysis_status === 'processing') {
    return (
      <div className="rounded-xl border border-purple-100 bg-purple-50 p-4 flex items-center gap-3">
        <Loader2 className="w-4 h-4 animate-spin text-purple-500 shrink-0" />
        <p className="text-[13px] text-purple-700">KI analysiert den Reel...</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-purple-100 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
          </div>
          <h3 className="text-[13px] font-semibold text-gray-900">KI-Analyse</h3>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={loading}
          title="Neu analysieren"
          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all disabled:opacity-40"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Summary */}
      {reel.gemini_summary && (
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Zusammenfassung</p>
          <p className="text-[13px] leading-relaxed text-gray-700">{reel.gemini_summary}</p>
        </div>
      )}

      {/* Tags */}
      {reel.gemini_tags && reel.gemini_tags.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Themen</p>
          <div className="flex flex-wrap gap-1.5">
            {reel.gemini_tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full bg-white border border-gray-200 text-[11px] text-gray-600"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Category suggestion */}
      {reel.gemini_category_suggestion && (
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Vorgeschlagene Kategorie</p>
          <span className="inline-block px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-100 text-[12px] text-blue-600 font-medium">
            {reel.gemini_category_suggestion}
          </span>
        </div>
      )}

      {/* Transcript collapsible */}
      {reel.gemini_transcript && (
        <div className="space-y-2">
          <button
            onClick={() => setTranscriptOpen(!transcriptOpen)}
            className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400 hover:text-gray-700 transition-colors"
          >
            Transkript
            {transcriptOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {transcriptOpen && (
            <p className="text-[12px] leading-relaxed bg-white border border-gray-100 rounded-lg p-3 text-gray-600 whitespace-pre-wrap">
              {reel.gemini_transcript}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
