import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/server'

interface InstagramSavedPost {
  string_map_data: { 'Saved on': { href: string; timestamp: number } }
}

export async function POST(req: NextRequest) {
  const supabase = createRouteClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  try {
    const body = await req.json()
    let urls: { url: string; savedAt?: number }[] = []

    if (Array.isArray(body)) {
      urls = body.map((u: string) => ({ url: u }))
    } else if (body.saved_saved_media) {
      urls = (body.saved_saved_media as InstagramSavedPost[])
        .map((item) => ({
          url: item.string_map_data?.['Saved on']?.href,
          savedAt: item.string_map_data?.['Saved on']?.timestamp,
        }))
        .filter((item) => item.url?.includes('instagram.com'))
    } else if (body.url) {
      urls = [{ url: body.url }]
    } else {
      return NextResponse.json({ error: 'Ungültiges Format' }, { status: 400 })
    }

    if (urls.length === 0) return NextResponse.json({ error: 'Keine Instagram-URLs gefunden' }, { status: 400 })

    // Check existing URLs
    const { data: existing } = await supabase
      .from('reels')
      .select('url')
      .eq('user_id', user.id)

    const existingUrls = new Set((existing ?? []).map((r: any) => r.url))
    const newUrls = urls.filter((u) => !existingUrls.has(u.url))

    if (newUrls.length === 0) {
      return NextResponse.json({ imported: 0, skipped: urls.length, message: 'Alle URLs bereits vorhanden' })
    }

    const profileId = req.nextUrl.searchParams.get('profile_id') || null

    const now = new Date().toISOString()
    const { data: inserted, error } = await supabase.from('reels').insert(
      newUrls.map((item) => ({
        url: item.url,
        user_id: user.id,
        profile_id: profileId,
        analysis_status: 'pending',
        is_favorite: false,
        saved_at: item.savedAt ? new Date(item.savedAt * 1000).toISOString() : now,
        updated_at: now,
      }))
    ).select('id')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Auto-analyze: trigger analyze for each newly imported reel (fire and forget)
    const autoAnalyze = req.nextUrl.searchParams.get('analyze') === 'true' || (body.url && !body.skipAnalyze)
    if (autoAnalyze && inserted && inserted.length > 0) {
      const baseUrl = req.nextUrl.origin
      inserted.forEach(({ id }: { id: string }) => {
        fetch(`${baseUrl}/api/reels/${id}/analyze`, {
          method: 'POST',
          headers: { cookie: req.headers.get('cookie') || '' },
        }).catch(() => { /* ignore */ })
      })
    }

    return NextResponse.json({ imported: newUrls.length, skipped: existingUrls.size, total: urls.length })
  } catch (err) {
    console.error('[import error]', err)
    return NextResponse.json({ error: 'Import fehlgeschlagen' }, { status: 500 })
  }
}
