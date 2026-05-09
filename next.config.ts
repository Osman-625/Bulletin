import type { NextConfig } from 'next'
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

const nextConfig: NextConfig = {
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
}

export default nextConfig
