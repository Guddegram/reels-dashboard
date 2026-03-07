import { NextResponse } from 'next/server'
import { buildOAuthUrl } from '@/lib/instagram/oauth'

export async function GET() {
  const url = buildOAuthUrl()
  return NextResponse.redirect(url)
}
