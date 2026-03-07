import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const session = req.cookies.get('__session')?.value
  const isLoginPage = req.nextUrl.pathname.startsWith('/login')
  const isApiAuth = req.nextUrl.pathname.startsWith('/api/auth')
  const isAuthExchange = req.nextUrl.pathname.startsWith('/auth/exchange')

  // Allow auth routes through
  if (isApiAuth || isAuthExchange) return NextResponse.next()

  if (!session && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (session && isLoginPage) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
