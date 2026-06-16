export const ANNOUNCEMENT_TITLE_MAX = 120
export const ANNOUNCEMENT_BODY_MAX = 5000
export const BANNER_MAX_FILE_SIZE_MB = 5
export const BANNER_MAX_FILE_SIZE_BYTES = BANNER_MAX_FILE_SIZE_MB * 1024 * 1024

type AnnouncementTextOptions = {
  requireComplete?: boolean
}

type AnnouncementScheduleOptions = {
  now?: number | Date
}

type AnnouncementScheduleFields = {
  expiresAt: string | null
  scheduledPublishAt: string | null
  pinnedUntil: string | null
}

type BannerUrlOptions = {
  userId?: string | null
  organizationId?: string | null
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

export function readAnnouncementScheduleFields(
  formData: FormData,
  options: AnnouncementScheduleOptions = {}
): AnnouncementScheduleFields {
  const fields = {
    expiresAt: readOptionalIsoDate(formData, 'expires_at'),
    scheduledPublishAt: readOptionalIsoDate(formData, 'scheduled_publish_at'),
    pinnedUntil: readOptionalIsoDate(formData, 'pinned_until'),
  }

  validateAnnouncementScheduleFields(fields, options)
  return fields
}

export function validateAnnouncementScheduleFields(
  { expiresAt, scheduledPublishAt, pinnedUntil }: AnnouncementScheduleFields,
  options: AnnouncementScheduleOptions = {}
) {
  const nowMs =
    options.now instanceof Date
      ? options.now.getTime()
      : typeof options.now === 'number'
        ? options.now
        : Date.now()
  const expiresMs = dateMs(expiresAt)
  const scheduledMs = dateMs(scheduledPublishAt)
  const pinnedMs = dateMs(pinnedUntil)

  if (expiresMs !== null && expiresMs <= nowMs) {
    throw new Error('Expiration date must be in the future.')
  }

  if (scheduledMs !== null && scheduledMs <= nowMs) {
    throw new Error('Scheduled publish time must be in the future.')
  }

  if (pinnedMs !== null && pinnedMs <= nowMs) {
    throw new Error('Pinned until must be in the future.')
  }

  if (scheduledMs !== null && expiresMs !== null && expiresMs <= scheduledMs) {
    throw new Error('Expiration date must be after the scheduled publish time.')
  }

  if (pinnedMs !== null && expiresMs !== null && pinnedMs > expiresMs) {
    throw new Error('Pinned until must not be after the expiration date.')
  }
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

export function readOptionalBannerUrl(
  formData: FormData,
  key: string,
  options: BannerUrlOptions = {}
): string | null {
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
    let supabase: URL | null = null
    try {
      supabase = new URL(supabaseUrl)
    } catch {
      supabase = null
    }

    if (
      supabase &&
      url.hostname === supabase.hostname &&
      url.pathname.startsWith('/storage/v1/object/public/banner-images/')
    ) {
      assertBannerPathScope(url.pathname, options)
      return url.toString()
    }
  }

  throw new Error('Banner image must come from the Bulletin banner-images storage bucket.')
}

function dateMs(value: string | null) {
  if (!value) return null
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? null : parsed
}

function assertBannerPathScope(pathname: string, options: BannerUrlOptions) {
  if (!options.userId && !options.organizationId) return

  const marker = '/storage/v1/object/public/banner-images/'
  const markerIndex = pathname.indexOf(marker)
  if (markerIndex === -1) return

  const storagePath = decodeURIComponent(pathname.slice(markerIndex + marker.length))
  const [userSegment, organizationSegment] = storagePath.split('/')

  if (
    (options.userId && userSegment !== options.userId) ||
    (options.organizationId && organizationSegment !== options.organizationId)
  ) {
    throw new Error('Banner image must be uploaded by your account for this organization.')
  }
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
