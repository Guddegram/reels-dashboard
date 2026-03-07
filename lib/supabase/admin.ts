import { createClient } from '@supabase/supabase-js'

// Service Role Client — bypasses RLS, nur für Server-Side API Routes
export const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// Verifiziert die Supabase Session und gibt die user_id zurück
export async function verifySession(accessToken: string): Promise<string | null> {
  if (!accessToken) return null
  const { data: { user }, error } = await adminSupabase.auth.getUser(accessToken)
  if (error || !user) return null
  return user.id
}
