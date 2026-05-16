import type { MetadataRoute } from 'next'
import { getCanonicalSiteUrl } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getCanonicalSiteUrl()

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/super-admin/', '/owner/', '/dashboard/', '/api/setup'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
