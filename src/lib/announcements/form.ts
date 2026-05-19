export const ANNOUNCEMENT_TITLE_MAX = 120
export const ANNOUNCEMENT_BODY_MAX = 5000

type AnnouncementTextOptions = {
  requireComplete?: boolean
}

export function readAnnouncementTextFields(
  formData: FormData,
  options: AnnouncementTextOptions = {}
) {
  const title = readTrimmedText(formData, 'title')
  const body = readTrimmedText(formData, 'body')

  if (title.length > ANNOUNCEMENT_TITLE_MAX) {
    throw new Error(`Title must be ${ANNOUNCEMENT_TITLE_MAX} characters or fewer.`)
  }

  if (body.length > ANNOUNCEMENT_BODY_MAX) {
    throw new Error(`Body must be ${ANNOUNCEMENT_BODY_MAX} characters or fewer.`)
  }

  if (options.requireComplete) {
    assertAnnouncementReadyForReview(title, body)
  }

  return {
    title: title || 'Untitled Announcement',
    body,
  }
}

export function assertAnnouncementReadyForReview(
  title: string | null | undefined,
  body: string | null | undefined
) {
  if (!(title ?? '').trim()) {
    throw new Error('Add a title before submitting for review.')
  }

  if (!(body ?? '').trim()) {
    throw new Error('Add announcement body before submitting for review.')
  }
}

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

function readTrimmedText(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}
