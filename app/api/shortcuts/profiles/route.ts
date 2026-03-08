import { NextRequest, NextResponse } from 'next/server'
import { adminSupabase } from '@/lib/supabase/admin'

function validateToken(req: NextRequest): boolean {
  const auth = req.headers.get('authorization')
  const token = process.env.SHORTCUT_TOKEN
  if (!token) return false
  return auth === `Bearer ${token}`
}

export async function GET(req: NextRequest) {
  if (!validateToken(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = process.env.SHORTCUT_USER_ID
  if (!userId) {
    return NextResponse.json({ error: 'SHORTCUT_USER_ID not configured' }, { status: 500 })
  }

  const nameFilter = req.nextUrl.searchParams.get('name')

  let query = adminSupabase
    .from('categories')
    .select('id, name, slug, color, icon')
    .eq('user_id', userId)
    .eq('type', 'profile')
    .order('sort_order', { ascending: true })

  if (nameFilter) query = query.eq('name', nameFilter)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // If filtered by name, return single object (for ID lookup in Shortcut)
  if (nameFilter) return NextResponse.json(data?.[0] ?? null)

  return NextResponse.json(data ?? [])
}
