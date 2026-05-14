import type { MetadataRoute } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://bulletininti.vercel.app'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/super-admin/', '/owner/', '/dashboard/', '/api/setup'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
