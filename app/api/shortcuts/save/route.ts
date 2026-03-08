import { NextRequest, NextResponse } from 'next/server'
import { adminSupabase } from '@/lib/supabase/admin'

function validateToken(req: NextRequest): boolean {
  const auth = req.headers.get('authorization')
  const token = process.env.SHORTCUT_TOKEN
  if (!token) return false
  return auth === `Bearer ${token}`
}

export async function POST(req: NextRequest) {
  if (!validateToken(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = process.env.SHORTCUT_USER_ID
  if (!userId) {
    return NextResponse.json({ error: 'SHORTCUT_USER_ID not configured' }, { status: 500 })
  }

  // Support both JSON body and query params (iOS Shortcuts sends query params more reliably)
  const urlParam = req.nextUrl.searchParams.get('url')
  const profileParam = req.nextUrl.searchParams.get('profile_id')

  let url: string = urlParam ?? ''
  let profileId: string | null = profileParam ?? null

  if (!urlParam) {
    try {
      const body = await req.json()
      url = body.url ?? ''
      profileId = body.profile_id ?? null
    } catch {
      // body might be empty when using query params
    }
  }

  if (!url || !url.includes('instagram.com')) {
    return NextResponse.json({ error: 'Ungültige Instagram-URL' }, { status: 400 })
  }

  // Deduplication check
  const { data: existing } = await adminSupabase
    .from('reels')
    .select('id')
    .eq('user_id', userId)
    .eq('url', url)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ imported: 0, skipped: 1, message: 'Bereits vorhanden' })
  }

  const now = new Date().toISOString()
  const { data: inserted, error } = await adminSupabase
    .from('reels')
    .insert({
      url,
      user_id: userId,
      profile_id: profileId,
      analysis_status: 'pending',
      is_favorite: false,
      saved_at: now,
      updated_at: now,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Auto-analyze (fire and forget)
  const autoAnalyze = req.nextUrl.searchParams.get('analyze') === 'true'
  if (autoAnalyze && inserted?.id) {
    const baseUrl = req.nextUrl.origin
    const token = process.env.SHORTCUT_TOKEN!
    fetch(`${baseUrl}/api/reels/${inserted.id}/analyze`, {
      method: 'POST',
      headers: { 'x-internal-token': token },
    }).catch(() => { /* ignore */ })
  }

  return NextResponse.json({ imported: 1, skipped: 0 })
}
