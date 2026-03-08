import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/server'

const REEL_SELECT = '*, category:categories!reels_category_id_fkey(id,name,slug,color,icon,type), profile:categories!reels_profile_id_fkey(id,name,slug,color,icon,type)'

export async function GET(req: NextRequest) {
  const supabase = createRouteClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const profile = searchParams.get('profile')
  const search = searchParams.get('search')
  const sort = searchParams.get('sort') || 'newest'
  const favorites = searchParams.get('favorites') === 'true'
  const limit = parseInt(searchParams.get('limit') || '4000')

  let query = supabase
    .from('reels')
    .select(REEL_SELECT)
    .eq('user_id', user.id)
    .order('saved_at', { ascending: sort === 'oldest' })
    .limit(limit)

  if (favorites) query = query.eq('is_favorite', true)
  if (search) {
    const q = `%${search}%`
    query = query.or(`title.ilike.${q},gemini_summary.ilike.${q},author_username.ilike.${q},gemini_transcript.ilike.${q}`)
  }

  const { data: reels, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Post-query filter für category/profile slug (via JOIN result)
  let result = reels ?? []
  if (category && category !== 'all') result = result.filter((r: any) => r.category?.slug === category)
  if (profile) result = result.filter((r: any) => r.profile?.slug === profile)

  return NextResponse.json({ reels: result, total: result.length })
}

export async function POST(req: NextRequest) {
  const supabase = createRouteClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const body = await req.json()
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('reels')
    .insert({
      ...body,
      user_id: user.id,
      analysis_status: 'pending',
      is_favorite: false,
      saved_at: now,
      updated_at: now,
    })
    .select(REEL_SELECT)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
