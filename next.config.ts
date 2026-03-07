import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: '*.cdninstagram.com' },
      { hostname: 'scontent*.cdninstagram.com' },
      { hostname: '*.supabase.co' },
    ],
  },
}

export default nextConfig
