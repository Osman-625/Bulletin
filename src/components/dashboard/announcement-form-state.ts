import type { AutosaveStatus } from './AutosaveIndicator'
import type { PostStatus } from '@/shared/types'
import type {
  AnnouncementDisplayFont,
  AnnouncementDisplaySize,
  AnnouncementUrgency,
} from '@/modules/announcements/presentation'

export type AnnouncementFormData = {
  id?: string
  title: string
  body: string
  status: PostStatus
  category_id: string | null
  banner_url: string | null
  registration_link: string | null
  expires_at: string | null
  scheduled_publish_at: string | null
  pinned_until: string | null
  rejection_comment: string | null
  view_count: number
  published_at: string | null
  urgency: AnnouncementUrgency
  display_font: AnnouncementDisplayFont
  display_size: AnnouncementDisplaySize
}

type AnnouncementFormState = {
  title: string
  body: string
  categoryId: string
  bannerUrl: string
  registrationLink: string
  expiresAt: string
  scheduledPublishAt: string
  pinnedUntil: string
  status: PostStatus
  urgency: AnnouncementUrgency
  displayFont: AnnouncementDisplayFont
  displaySize: AnnouncementDisplaySize
  saveState: AutosaveStatus
  isSaving: boolean
  isPublishing: boolean
  urlError: string
  formError: string
}

type AnnouncementFormAction = {
  type: 'patch'
  values: Partial<AnnouncementFormState>
}

export type AnnouncementFormValues = Partial<AnnouncementFormState>

export function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function toDateInputValue(iso: string | null | undefined): string {
  return iso?.slice(0, 10) ?? ''
}

function toDateTimeLocalInputValue(iso: string | null | undefined): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''

  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

export function createAnnouncementFormState(
  initialData: AnnouncementFormData
): AnnouncementFormState {
  return {
    title: initialData.title,
    body: initialData.body,
    categoryId: initialData.category_id ?? '',
    bannerUrl: initialData.banner_url ?? '',
    registrationLink: initialData.registration_link ?? '',
    expiresAt: toDateInputValue(initialData.expires_at),
    scheduledPublishAt: toDateTimeLocalInputValue(initialData.scheduled_publish_at),
    pinnedUntil: toDateTimeLocalInputValue(initialData.pinned_until),
    status: initialData.status,
    urgency: initialData.urgency,
    displayFont: initialData.display_font,
    displaySize: initialData.display_size,
    saveState: 'idle',
    isSaving: false,
    isPublishing: false,
    urlError: '',
    formError: '',
  }
}

export function announcementFormReducer(
  state: AnnouncementFormState,
  action: AnnouncementFormAction
): AnnouncementFormState {
  switch (action.type) {
    case 'patch':
      return { ...state, ...action.values }
  }
}

export function isFutureDateTime(value: string): boolean {
  if (!value) return false
  const date = new Date(value)
  return !Number.isNaN(date.getTime()) && date.getTime() > Date.now()
}

export function futureDateTimeError(value: string, label: string): string {
  if (!value) return ''
  return isFutureDateTime(value) ? '' : `${label} must be in the future or left blank.`
}
