export const DEFAULT_SITE_URL = 'https://bulletininti.vercel.app'

export function getCanonicalSiteUrl(value = process.env.NEXT_PUBLIC_APP_URL): string {
  if (!value) return DEFAULT_SITE_URL

  try {
    const url = new URL(value)
    const isLocalhost =
      url.hostname === 'localhost' ||
      url.hostname === '127.0.0.1' ||
      url.hostname === '0.0.0.0' ||
      url.hostname === '::1'

    if (isLocalhost || (url.protocol !== 'https:' && process.env.NODE_ENV === 'production')) {
      return DEFAULT_SITE_URL
    }

    return url.origin
  } catch {
    return DEFAULT_SITE_URL
  }
}
