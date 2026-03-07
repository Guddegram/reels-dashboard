import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/server'

const ALL_DEFAULTS = [
  { name: 'Business Ideas', slug: 'business-ideas', color: '#F59E0B', icon: '💡', sort_order: 1,  type: 'category' },
  { name: 'KI',             slug: 'ki',             color: '#8B5CF6', icon: '🤖', sort_order: 2,  type: 'category' },
  { name: 'Claude',         slug: 'claude',         color: '#6366F1', icon: '🧠', sort_order: 3,  type: 'category' },
  { name: 'Gemini',         slug: 'gemini',         color: '#10B981', icon: '✨', sort_order: 4,  type: 'category' },
  { name: 'OpenAI',         slug: 'openai',         color: '#3B82F6', icon: '⚡', sort_order: 5,  type: 'category' },
  { name: 'Religion',       slug: 'religion',       color: '#F97316', icon: '🌙', sort_order: 6,  type: 'category' },
  { name: 'Sport',          slug: 'sport',          color: '#EF4444', icon: '⚽', sort_order: 7,  type: 'category' },
  { name: 'Lustig',         slug: 'lustig',         color: '#EC4899', icon: '😂', sort_order: 8,  type: 'category' },
  { name: 'Sonstige',       slug: 'sonstige',       color: '#6B7280', icon: '📌', sort_order: 99, type: 'category' },
  { name: 'Guadgram',       slug: 'guadgram',       color: '#06B6D4', icon: '📸', sort_order: 1,  type: 'profile' },
  { name: 'KI Agent hilft', slug: 'ki-agent-hilft', color: '#8B5CF6', icon: '🤖', sort_order: 2,  type: 'profile' },
  { name: 'Elektromeister', slug: 'elektromeister', color: '#F59E0B', icon: '⚡', sort_order: 3,  type: 'profile' },
  { name: 'Avon',           slug: 'avon',           color: '#EC4899', icon: '💄', sort_order: 4,  type: 'profile' },
]

export async function GET() {
  const supabase = createRouteClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const { data: existing } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', user.id)
    .order('sort_order')

  const existingSlugs = new Set((existing ?? []).map((c: any) => c.slug))
  const missing = ALL_DEFAULTS.filter((d) => !existingSlugs.has(d.slug))

  if (missing.length > 0) {
    await supabase.from('categories').insert(
      missing.map((cat) => ({ ...cat, user_id: user.id }))
    )
    const { data: updated } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('sort_order')
    return NextResponse.json(updated ?? [])
  }

  return NextResponse.json(existing ?? [])
}

export async function POST(req: NextRequest) {
  const supabase = createRouteClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const body = await req.json()
  const slug = body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  const { data, error } = await supabase
    .from('categories')
    .insert({ ...body, slug, user_id: user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
