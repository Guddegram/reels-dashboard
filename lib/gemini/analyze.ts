import { geminiFlash } from './client'
import type { GeminiAnalysis } from '@/types'

function parseGeminiJson(text: string): GeminiAnalysis {
  const cleaned = text
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()
  return JSON.parse(cleaned)
}

export async function analyzeReel({
  url,
  author,
  title,
  description,
  thumbnailBase64,
  categories,
}: {
  url: string
  author?: string | null
  title?: string | null
  description?: string | null
  thumbnailBase64?: string | null
  categories?: string[]
}): Promise<GeminiAnalysis> {
  const categoryList = categories && categories.length > 0
    ? categories.join(', ')
    : 'Business Ideas, KI, Claude, Gemini, OpenAI, Religion, Sport, Lustig, Sonstige'

  const prompt = `Du bist ein Content-Analyse-Assistent für Instagram Reels.

Ein Nutzer hat diesen Reel gespeichert. Du kannst keine URLs abrufen – analysiere stattdessen die folgenden Metadaten:

URL: ${url}
Autor: ${author || 'unbekannt'}
Titel: ${title || 'keiner angegeben'}
Beschreibung/Caption: ${description || 'keine angegeben'}

${thumbnailBase64 ? 'Das Thumbnail des Reels ist beigefügt – analysiere auch das Bild.' : ''}

Erstelle eine Analyse basierend auf den vorhandenen Infos (Caption, Hashtags, Autor, etc.).
Falls ein Bild vorhanden ist, nutze es für die Analyse.
Antworte NUR als JSON (kein Markdown, kein Text davor/danach):
{
  "summary": "2-3 Sätze: Was zeigt/erklärt dieser Reel? Basiere dich auf Caption und Bild",
  "tags": ["hashtag1", "hashtag2", "hashtag3"],
  "category_suggestion": "Eine aus: ${categoryList}",
  "transcript": "Transkript der Caption/Text im Bild falls erkennbar, sonst leerer String",
  "language": "de oder en"
}`

  let result

  if (thumbnailBase64) {
    result = await geminiFlash.generateContent([
      {
        inlineData: {
          data: thumbnailBase64,
          mimeType: 'image/jpeg',
        },
      },
      prompt,
    ])
  } else {
    result = await geminiFlash.generateContent(prompt)
  }

  const text = result.response.text()
  return parseGeminiJson(text)
}
