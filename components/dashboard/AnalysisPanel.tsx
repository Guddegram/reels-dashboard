'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { Reel } from '@/types'
import { Sparkles, ChevronDown, ChevronUp, Loader2, RefreshCw, Lightbulb, Download } from 'lucide-react'

interface AnalysisPanelProps {
  reel: Reel
  onAnalyze: (id: string) => Promise<void>
}

export function AnalysisPanel({ reel, onAnalyze }: AnalysisPanelProps) {
  const [transcriptOpen, setTranscriptOpen] = useState(false)
  const [businessPlanOpen, setBusinessPlanOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleAnalyze = async () => {
    setLoading(true)
    await onAnalyze(reel.id)
    setLoading(false)
  }

  const handleNotebookExport = () => {
    const ba = reel.business_analysis
    const lines = [
      `# Business-Analyse: ${reel.title || reel.author_username || 'Unbekannt'}`,
      ``,
      `**Reel URL:** ${reel.url}`,
      `**Autor:** @${reel.author_username || '—'}`,
      `**Gespeichert am:** ${reel.saved_at ? new Date(reel.saved_at).toLocaleDateString('de-DE') : '—'}`,
      ``,
      `---`,
      ``,
      `## Basis-Analyse`,
      ``,
      reel.gemini_summary ? `**Zusammenfassung:** ${reel.gemini_summary}` : '',
      reel.gemini_tags?.length ? `**Tags:** ${reel.gemini_tags.join(', ')}` : '',
      reel.gemini_category_suggestion ? `**Kategorie:** ${reel.gemini_category_suggestion}` : '',
      ``,
    ]

    if (ba) {
      lines.push(
        `---`,
        ``,
        `## Business-Analyse`,
        ``,
        `| Kriterium | Score |`,
        `|---|---|`,
        `| Passt zu Guled | ${ba.fit_score}/10 |`,
        `| Umsatzpotenzial | ${ba.potential_score}/10 |`,
        `| Gesamt | **${ba.overall_score}/10** |`,
        ``,
        `**Bewertung:** ${ba.reasoning}`,
        ``,
        ba.matching_project ? `**Passendes Projekt:** ${ba.matching_project}` : '',
        ba.new_project_name ? `**Neues Projekt vorgeschlagen:** ${ba.new_project_name}` : '',
        ``,
        ba.business_plan || '',
        ``,
        `## Action Items`,
        ``,
        ...(ba.action_items || []).map((item, i) => `${i + 1}. ${item}`),
      )
    }

    const content = lines.filter((l) => l !== undefined).join('\n')
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `business-analyse-${reel.id.slice(0, 8)}.md`
    a.click()
    URL.revokeObjectURL(url)
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
    <div className="space-y-3">
      {/* Basic Analysis */}
      <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-4">
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

        {reel.gemini_summary && (
          <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Zusammenfassung</p>
            <p className="text-[13px] leading-relaxed text-gray-700">{reel.gemini_summary}</p>
          </div>
        )}

        {reel.gemini_tags && reel.gemini_tags.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Themen</p>
            <div className="flex flex-wrap gap-1.5">
              {reel.gemini_tags.map((tag) => (
                <span key={tag} className="px-2 py-0.5 rounded-full bg-white border border-gray-200 text-[11px] text-gray-600">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {reel.gemini_category_suggestion && (
          <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Vorgeschlagene Kategorie</p>
            <span className="inline-block px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-100 text-[12px] text-blue-600 font-medium">
              {reel.gemini_category_suggestion}
            </span>
          </div>
        )}

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

      {/* Business Analysis */}
      {reel.is_business_relevant && reel.business_analysis && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-200 flex items-center justify-center">
                <Lightbulb className="w-3.5 h-3.5 text-amber-700" />
              </div>
              <h3 className="text-[13px] font-semibold text-gray-900">Business-Analyse</h3>
              <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 text-[11px] font-bold">
                {reel.business_score}/10
              </span>
            </div>
            <button
              onClick={handleNotebookExport}
              title="Für NotebookLM exportieren"
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-amber-700 hover:bg-amber-100 transition-all"
            >
              <Download className="w-3 h-3" /> Export
            </button>
          </div>

          {/* Scores */}
          <div className="grid grid-cols-2 gap-2">
            <ScoreBar label="Passt zu dir" score={reel.business_analysis.fit_score} />
            <ScoreBar label="Umsatzpotenzial" score={reel.business_analysis.potential_score} />
          </div>

          {/* Reasoning */}
          <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-700">Bewertung</p>
            <p className="text-[13px] leading-relaxed text-gray-700">{reel.business_analysis.reasoning}</p>
          </div>

          {/* Matching project */}
          {reel.business_analysis.matching_project && (
            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-700">Passendes Projekt</p>
              <span className="inline-block px-2.5 py-1 rounded-lg bg-white border border-amber-200 text-[12px] text-amber-800 font-medium">
                📁 {reel.business_analysis.matching_project}
              </span>
            </div>
          )}

          {reel.business_analysis.new_project_name && !reel.business_analysis.matching_project && (
            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-700">Neues Projekt vorgeschlagen</p>
              <span className="inline-block px-2.5 py-1 rounded-lg bg-white border border-amber-200 text-[12px] text-amber-800 font-medium">
                ✨ {reel.business_analysis.new_project_name}
              </span>
            </div>
          )}

          {/* Action items */}
          {reel.business_analysis.action_items?.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-700">Nächste Schritte</p>
              <ul className="space-y-1.5">
                {reel.business_analysis.action_items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12px] text-gray-700">
                    <span className="w-4 h-4 rounded-full bg-amber-200 text-amber-800 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Business Plan collapsible */}
          {reel.business_analysis.business_plan && (
            <div className="space-y-2">
              <button
                onClick={() => setBusinessPlanOpen(!businessPlanOpen)}
                className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-amber-700 hover:text-amber-900 transition-colors"
              >
                Businessplan
                {businessPlanOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              {businessPlanOpen && (
                <div className="text-[12px] leading-relaxed bg-white border border-amber-100 rounded-lg p-3 text-gray-700 whitespace-pre-wrap">
                  {reel.business_analysis.business_plan}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const pct = Math.round((score / 10) * 100)
  const color = score >= 8 ? 'bg-green-400' : score >= 6 ? 'bg-amber-400' : 'bg-red-400'
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-gray-600">{label}</span>
        <span className="text-[11px] font-bold text-gray-800">{score}/10</span>
      </div>
      <div className="h-1.5 bg-amber-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
