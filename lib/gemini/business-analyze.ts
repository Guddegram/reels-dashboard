import { geminiFlash } from './client'
import type { BusinessAnalysis, GeminiAnalysis } from '@/types'

const GULED_PROFILE = `
GULED'S PROFIL:
- Vollzeit-Elektroniker in der Industrie (Hauptjob, Wochentags)
- Baut aktiv Side-Business auf
- Aktive Projekte: KI Agent hilft (KI-Agentur, WhatsApp & Voice Agents), Webdesign (Freelance), Social Media Firma (Content für Kunden), Etsy WM-Merch (T-Shirts + digitale Produkte), Airbnb (Ladenlokale als Kurzzeitmiete), Keramik-Deko (islamische Deko für Etsy/TikTok)
- Ziel: Passives Einkommen aufbauen, skalierbare Geschäftsmodelle
- Anfänger beim Programmieren, lernt mit KI-Tools
`

const BUSINESS_KEYWORDS = [
  'business', 'geld', 'money', 'passive', 'invest', 'startup', 'ki', 'ai',
  'einkommen', 'verdienen', 'etsy', 'shopify', 'dropshipping', 'marketing',
  'freelance', 'client', 'agency', 'agentur', 'profit', 'revenue', 'scale',
  'automation', 'automatisierung', 'saas', 'digital', 'online',
]

export function isBusinessRelevant(
  categorySlug: string | null,
  tags: string[] | null,
  description: string | null,
): boolean {
  if (categorySlug === 'business-ideas') return true
  const text = [
    ...(tags ?? []),
    description ?? '',
  ].join(' ').toLowerCase()
  return BUSINESS_KEYWORDS.some((kw) => text.includes(kw))
}

function parseBusinessJson(text: string): BusinessAnalysis {
  const cleaned = text
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()
  return JSON.parse(cleaned)
}

export async function analyzeBusinessPotential({
  url,
  author,
  title,
  description,
  basicAnalysis,
  thumbnailBase64,
}: {
  url: string
  author?: string | null
  title?: string | null
  description?: string | null
  basicAnalysis: GeminiAnalysis
  thumbnailBase64?: string | null
}): Promise<BusinessAnalysis> {
  const prompt = `Du bist ein erfahrener Business-Berater und analysierst einen Instagram Reel für deinen Klienten.

${GULED_PROFILE}

REEL-DATEN:
URL: ${url}
Autor: ${author || 'unbekannt'}
Titel: ${title || 'nicht vorhanden'}
Caption/Beschreibung: ${description || 'nicht vorhanden'}
KI-Zusammenfassung: ${basicAnalysis.summary}
Tags: ${basicAnalysis.tags.join(', ')}
Erkannter Bereich: ${basicAnalysis.category_suggestion}
${thumbnailBase64 ? 'Thumbnail ist beigefügt.' : ''}

AUFGABE:
Bewerte diesen Reel als Business-Idee für Guled.
Antworte NUR als JSON (kein Markdown, kein Text davor/danach):
{
  "is_relevant": true,
  "fit_score": 8,
  "potential_score": 7,
  "overall_score": 8,
  "reasoning": "2-3 Sätze warum diese Idee gut/schlecht zu Guled passt",
  "matching_project": "ki-agent-hilft ODER webdesign ODER social-media-firma ODER etsy-wm-merch ODER airbnb ODER keramik-deko ODER null",
  "new_project_name": "Name für neues Projekt falls kein bestehendes passt, sonst null",
  "business_plan": "## Idee\\n[Was genau]\\n\\n## Potenzial\\n[Warum Potenzial]\\n\\n## Nächste Schritte\\n1. [Konkreter Schritt]\\n2. [Konkreter Schritt]\\n3. [Konkreter Schritt]",
  "action_items": ["Konkreter Schritt 1", "Konkreter Schritt 2", "Konkreter Schritt 3"]
}

WICHTIG:
- fit_score: Passt die Idee zu Guled's Profil, Skills und Projekten? (1-10)
- potential_score: Wie groß ist das Einkommenspotenzial? (1-10)
- overall_score: Gesamtbewertung (1-10)
- matching_project: Passt es zu einem bestehenden Projekt? Exakt einen der slugs angeben oder null
- business_plan: Vollständiger Markdown-Text mit echten Inhalten
- action_items: 3 konkrete sofort umsetzbare Schritte`

  let result

  if (thumbnailBase64) {
    result = await geminiFlash.generateContent([
      { inlineData: { data: thumbnailBase64, mimeType: 'image/jpeg' } },
      prompt,
    ])
  } else {
    result = await geminiFlash.generateContent(prompt)
  }

  const text = result.response.text()
  return parseBusinessJson(text)
}
