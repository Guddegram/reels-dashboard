// Facebook Login (Meta OAuth 2.0) — Instagram Basic Display API deprecated Dec 2024
// Docs: https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow/

const GRAPH_VERSION = 'v21.0'

export function buildOAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID!,
    redirect_uri: process.env.META_REDIRECT_URI!,
    scope: 'public_profile',
    response_type: 'code',
    state: Math.random().toString(36).substring(2), // CSRF protection
  })

  // Facebook Login dialog (works for all Meta/Instagram accounts)
  return `https://www.facebook.com/dialog/oauth?${params.toString()}`
}

export async function exchangeCodeForToken(code: string): Promise<{
  access_token: string
  token_type: string
}> {
  const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token`)
  url.searchParams.set('client_id', process.env.META_APP_ID!)
  url.searchParams.set('client_secret', process.env.META_APP_SECRET!)
  url.searchParams.set('redirect_uri', process.env.META_REDIRECT_URI!)
  url.searchParams.set('code', code)

  const response = await fetch(url.toString())

  if (!response.ok) {
    const err = await response.json()
    throw new Error(`Token exchange failed: ${err.error?.message || response.status}`)
  }

  return response.json()
}

export async function getFacebookUser(accessToken: string): Promise<{
  id: string
  name: string
}> {
  const response = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/me?fields=id,name&access_token=${accessToken}`
  )

  if (!response.ok) {
    throw new Error('Failed to fetch Facebook user')
  }

  return response.json()
}
