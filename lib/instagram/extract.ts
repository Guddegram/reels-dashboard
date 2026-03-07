import type { ExtractedMetadata } from '@/types'

export function parseShortcode(url: string): string | null {
  const match = url.match(/\/(?:reel(?:s)?|p)\/([A-Za-z0-9_-]+)/)
  return match?.[1] ?? null
}

function decodeHtml(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#064;/g, '@')
    .replace(/&#x201[Cc]/g, '"')
    .replace(/&#x201[Dd]/g, '"')
    .replace(/&#x201E/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function parseOgMeta(html: string): Record<string, string> {
  const og: Record<string, string> = {}
  const matches = html.matchAll(/<meta[^>]+property="og:([\w:]+)"[^>]+content="([^"]+)"/g)
  for (const m of matches) og[m[1]] = decodeHtml(m[2])
  // Also try the reversed attribute order
  const matches2 = html.matchAll(/<meta[^>]+content="([^"]+)"[^>]+property="og:([\w:]+)"/g)
  for (const m of matches2) if (!og[m[2]]) og[m[2]] = decodeHtml(m[1])
  return og
}

export async function extractReelMetadata(url: string): Promise<ExtractedMetadata> {
  const shortcode = parseShortcode(url)

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
      },
      signal: AbortSignal.timeout(8000),
    })

    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    const html = await response.text()
    const og = parseOgMeta(html)

    // Extract author from og:url or og:title
    let authorUsername: string | null = null
    if (og.url) {
      const m = og.url.match(/instagram\.com\/([^/]+)\//)
      if (m && m[1] !== 'p' && m[1] !== 'reel') authorUsername = m[1]
    }
    if (!authorUsername && og.title) {
      const m = og.title.match(/^@?([a-zA-Z0-9._]+)\s+on Instagram/)
      if (m) authorUsername = m[1]
    }

    // Clean up description
    let description = og.description || null
    if (description) {
      // Remove "X likes, Y comments - username on date: " prefix
      description = description.replace(/^\d[^:]*:\s*/, '')
    }

    // Clean thumbnail URL (decode HTML entities in URL)
    const thumbnailUrl = og.image ? og.image.replace(/&amp;/g, '&') : null

    return {
      instagram_id: shortcode,
      author_username: authorUsername,
      author_name: authorUsername,
      title: og.title || null,
      external_thumbnail: thumbnailUrl,
      description,
    }
  } catch {
    return {
      instagram_id: shortcode,
      author_username: null,
      author_name: null,
      title: null,
      external_thumbnail: null,
      description: null,
    }
  }
}
