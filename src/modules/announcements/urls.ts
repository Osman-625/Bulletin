const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const UUID_IN_SEGMENT_PATTERN =
  /([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i

export function toSafeHttpUrl(value: string | null | undefined): string | null {
  if (!value) return null

  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null
  } catch {
    return null
  }
}

export function toSafeImageUrl(value: string | null | undefined): string | null {
  if (!value) return null

  if (value.startsWith('/') && !value.startsWith('//')) {
    return value
  }

  return toSafeHttpUrl(value)
}

function slugifyAnnouncementTitle(title: string): string {
  const slug = title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72)
    .replace(/-+$/g, '')

  return slug || 'announcement'
}

export function announcementPathSegment({ id, title }: { id: string; title: string }): string {
  return `${slugifyAnnouncementTitle(title)}-${id}`
}

export function announcementPath(announcement: { id: string; title: string }): string {
  return `/announcements/${announcementPathSegment(announcement)}`
}

export function announcementLookupId(segment: string): string {
  if (UUID_PATTERN.test(segment)) return segment
  return segment.match(UUID_IN_SEGMENT_PATTERN)?.[1] ?? segment
}
