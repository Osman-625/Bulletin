export function readOptionalIsoDate(formData: FormData, key: string): string | null {
  const value = formData.get(key)
  if (typeof value !== 'string' || value.trim() === '') return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  return date.toISOString()
}

export function readOptionalHttpUrl(
  formData: FormData,
  key: string,
  fieldName = 'URL'
): string | null {
  const value = readTrimmedOptionalString(formData, key)
  if (!value) return null

  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new Error(`${fieldName} must be a valid URL.`)
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`${fieldName} must start with http:// or https://.`)
  }

  return url.toString()
}

export function readOptionalBannerUrl(formData: FormData, key: string): string | null {
  const value = readTrimmedOptionalString(formData, key)
  if (!value) return null

  if (value.startsWith('/sample-announcements/')) {
    return value
  }

  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new Error('Banner image must be uploaded through Bulletin.')
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Banner image must use an http or https URL.')
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (supabaseUrl) {
    try {
      const supabase = new URL(supabaseUrl)
      if (
        url.hostname === supabase.hostname &&
        url.pathname.startsWith('/storage/v1/object/public/banner-images/')
      ) {
        return url.toString()
      }
    } catch {
      // Fall through to the explicit rejection below.
    }
  }

  throw new Error('Banner image must come from the Bulletin banner-images storage bucket.')
}

function readTrimmedOptionalString(formData: FormData, key: string): string | null {
  const value = formData.get(key)
  if (typeof value !== 'string') return null

  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}
