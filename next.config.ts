import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'
import path from 'path'

const supabaseImageHost = (() => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) return null

  try {
    return new URL(supabaseUrl).hostname
  } catch {
    return null
  }
})()

const PUBLIC_STATIC_CACHE_CONTROL = 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400'

const SECURITY_HEADERS = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
]

const PUBLIC_STATIC_CACHE_HEADERS = [
  {
    key: 'Cache-Control',
    value: PUBLIC_STATIC_CACHE_CONTROL,
  },
]

const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: supabaseImageHost
      ? [
          {
            protocol: 'https',
            hostname: supabaseImageHost,
            pathname: '/storage/v1/object/public/banner-images/**',
          },
        ]
      : [],
  },
  async headers() {
    return [
      {
        source: '/robots.txt',
        headers: PUBLIC_STATIC_CACHE_HEADERS,
      },
      {
        source: '/sitemap.xml',
        headers: PUBLIC_STATIC_CACHE_HEADERS,
      },
      {
        source: '/opengraph-image',
        headers: PUBLIC_STATIC_CACHE_HEADERS,
      },
      {
        source: '/twitter-image',
        headers: PUBLIC_STATIC_CACHE_HEADERS,
      },
      {
        source: '/(.*)',
        headers: SECURITY_HEADERS,
      },
    ]
  },
}

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
})
