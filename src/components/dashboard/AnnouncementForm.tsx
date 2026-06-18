'use client'

import { useState, useEffect, useRef, useCallback, useTransition } from 'react'
import { unstable_rethrow } from 'next/navigation'
import NextImage from 'next/image'
import { AlertTriangle, Calendar, Clock, Link2, Pin, Trash2, Type, Upload, X } from 'lucide-react'
import { cn } from '@/shared/utils'
import { BackNavButton } from '@/components/navigation/BackNavButton'
import { ActionBar } from './ActionBar'
import { GlassCard } from './GlassCard'
import type { AutosaveStatus } from './AutosaveIndicator'
import type { PostStatus } from '@/shared/types'
import { createClient } from '@/infrastructure/database/client'
import {
  ANNOUNCEMENT_BODY_MAX,
  ANNOUNCEMENT_TITLE_MAX,
  BANNER_MAX_FILE_SIZE_BYTES,
  BANNER_MAX_FILE_SIZE_MB,
} from '@/modules/announcements/form'
import { reportClientError } from '@/shared/errors/client-error-reporting'
import { captureProductEvent } from '@/shared/constants/product-analytics'
import {
  ANNOUNCEMENT_DISPLAY_FONTS,
  ANNOUNCEMENT_DISPLAY_SIZES,
  ANNOUNCEMENT_URGENCIES,
  CARD_TITLE_SIZES,
  DETAIL_BODY_SIZES,
  DISPLAY_FONT_LABELS,
  DISPLAY_SIZE_LABELS,
  URGENCY_META,
  getAnnouncementTitleFontClass,
  type AnnouncementDisplayFont,
  type AnnouncementDisplaySize,
  type AnnouncementUrgency,
} from '@/modules/announcements/presentation'

// ─── Types ───────────────────────────────────────────────────

type CategoryOption = {
  id: string
  name: string
  color: string | null
}

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

interface AnnouncementFormProps {
  initialData: AnnouncementFormData
  categories: CategoryOption[]
  organizationId?: string | null
  onSave: (formData: FormData) => Promise<{ success: boolean } | void>
  onPublish?: () => Promise<{ success: boolean } | void>
  onSaveAndPublish?: (formData: FormData) => Promise<{ success: boolean } | void>
  onUnpublish?: () => Promise<{ success: boolean } | void>
  onDelete?: () => Promise<void>
  isNew?: boolean
  backHref?: string
}

// ─── Helpers ─────────────────────────────────────────────────

function isValidUrl(str: string): boolean {
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

function isFutureDateTime(value: string): boolean {
  if (!value) return false
  const date = new Date(value)
  return !Number.isNaN(date.getTime()) && date.getTime() > Date.now()
}

function futureDateTimeError(value: string, label: string): string {
  if (!value) return ''
  return isFutureDateTime(value) ? '' : `${label} must be in the future or left blank.`
}

const READINESS_ITEMS = [
  'Title and body explain what students need to know.',
  'Date, venue, contact, and registration details are current.',
  'Banner image and urgency level still make sense on mobile.',
] as const

type DeleteAnnouncementHandler = (closeAfterError: () => void) => void

function DeleteAnnouncementControl({
  isPending,
  onDelete,
}: {
  isPending: boolean
  onDelete: DeleteAnnouncementHandler
}) {
  const deleteDialogRef = useRef<HTMLDialogElement | null>(null)
  const deleteCancelRef = useRef<HTMLButtonElement | null>(null)
  const deleteTriggerRef = useRef<HTMLButtonElement | null>(null)

  function openDeleteDialog() {
    const dialog = deleteDialogRef.current
    if (!dialog || dialog.open) return

    dialog.showModal()
    window.setTimeout(() => {
      deleteCancelRef.current?.focus()
    }, 0)
  }

  function closeDeleteDialog() {
    const dialog = deleteDialogRef.current
    if (dialog?.open) {
      dialog.close()
    }

    window.setTimeout(() => {
      deleteTriggerRef.current?.focus()
    }, 0)
  }

  function handleDeleteDialogCancel(event: React.SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault()
    closeDeleteDialog()
  }

  return (
    <div className="relative">
      <button
        ref={deleteTriggerRef}
        type="button"
        onClick={openDeleteDialog}
        className="flex min-h-11 items-center gap-1.5 rounded-lg text-xs text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-destructive)]"
      >
        <Trash2 size={14} aria-hidden="true" />
        Delete
      </button>
      <dialog
        ref={deleteDialogRef}
        aria-labelledby="delete-announcement-title"
        aria-describedby="delete-announcement-description"
        onCancel={handleDeleteDialogCancel}
        className="m-0 rounded-xl border border-[var(--color-destructive)]/30 bg-[var(--color-surface)] p-2 text-[var(--color-text-primary)] shadow-[var(--shadow-soft)] backdrop:bg-[color-mix(in_oklab,var(--color-text-primary)_30%,transparent)]"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span
            id="delete-announcement-title"
            className="text-xs font-semibold text-[var(--color-destructive)]"
          >
            Delete this?
          </span>
          <span id="delete-announcement-description" className="sr-only">
            This permanently deletes the announcement and cannot be undone.
          </span>
          <button
            type="button"
            onClick={() => onDelete(closeDeleteDialog)}
            disabled={isPending}
            className="min-h-11 rounded-lg bg-[var(--color-destructive)] px-3 text-xs font-medium text-[var(--color-surface)] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? 'Deleting...' : 'Confirm'}
          </button>
          <button
            ref={deleteCancelRef}
            type="button"
            onClick={closeDeleteDialog}
            className="min-h-11 rounded-lg border border-[var(--color-glass-border)] px-3 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-elevated)]"
          >
            Cancel
          </button>
        </div>
      </dialog>
    </div>
  )
}

function AnnouncementFormTopBar({
  backHref,
  isPending,
  onDelete,
}: {
  backHref: string
  isPending: boolean
  onDelete?: DeleteAnnouncementHandler
}) {
  return (
    <div className="mx-auto flex w-full max-w-[82rem] items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
      <BackNavButton
        fallbackHref={backHref}
        className="min-w-0 rounded-lg border-transparent bg-transparent px-0 text-sm text-[var(--color-text-secondary)] shadow-none hover:border-transparent hover:bg-transparent hover:text-[var(--color-text-primary)] hover:shadow-none"
      >
        Back to announcements
      </BackNavButton>

      {onDelete && <DeleteAnnouncementControl isPending={isPending} onDelete={onDelete} />}
    </div>
  )
}

function PublishingReadinessChecklist() {
  return (
    <section className="announcement-section-card p-5 sm:p-6">
      <p className="future-kicker">Publishing readiness</p>
      <h2 className="font-display mt-3 text-2xl leading-tight font-extrabold text-[var(--color-text-primary)]">
        Check before sending
      </h2>
      <div className="announcement-readiness-list mt-5">
        {READINESS_ITEMS.map((item, index) => (
          <div key={item} className="announcement-readiness-item">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-[0.75rem] bg-[var(--color-accent-surface)] font-mono text-xs font-bold text-[var(--color-accent)]">
              {String(index + 1).padStart(2, '0')}
            </span>
            <p className="text-sm leading-6 text-[var(--color-text-secondary)]">{item}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function AnnouncementLivePreview({
  bannerUrl,
  urgency,
  isScheduled,
  isPinned,
  displayFont,
  displaySize,
  selectedCategory,
  title,
  body,
  registrationLink,
  urlError,
}: {
  bannerUrl: string
  urgency: AnnouncementUrgency
  isScheduled: boolean
  isPinned: boolean
  displayFont: AnnouncementDisplayFont
  displaySize: AnnouncementDisplaySize
  selectedCategory: CategoryOption | undefined
  title: string
  body: string
  registrationLink: string
  urlError: string
}) {
  const selectedUrgency = URGENCY_META[urgency]
  const titleFontClass = getAnnouncementTitleFontClass(displayFont)

  return (
    <section className="announcement-preview-panel">
      <p className="mb-3 text-xs font-medium tracking-widest text-[var(--color-text-muted)] uppercase">
        Preview
      </p>
      <GlassCard hover={false} className="overflow-hidden">
        {bannerUrl && (
          <NextImage
            src={bannerUrl}
            alt="Preview banner"
            width={600}
            height={144}
            className="h-36 w-full object-contain"
            unoptimized
          />
        )}
        <div className="space-y-2 p-5">
          <div className="flex flex-wrap items-center gap-2">
            {urgency !== 'normal' && (
              <span
                className="rounded-md px-2.5 py-1 text-[15px] font-semibold"
                style={{
                  color: selectedUrgency.tone,
                  background: selectedUrgency.background,
                }}
              >
                {selectedUrgency.label}
              </span>
            )}
            {isScheduled && (
              <span className="rounded-md bg-[var(--color-accent-surface)] px-2.5 py-1 text-[15px] font-semibold text-[var(--color-accent-inti)]">
                Scheduled
              </span>
            )}
            {isPinned && (
              <span className="rounded-md bg-[var(--color-status-published-bg)] px-2.5 py-1 text-[15px] font-semibold text-[var(--color-status-published-text)]">
                Pinned
              </span>
            )}
            <span className="rounded-md bg-[var(--color-surface-elevated)] px-2.5 py-1 text-[15px] font-medium text-[var(--color-text-muted)]">
              {DISPLAY_FONT_LABELS[displayFont]} · {DISPLAY_SIZE_LABELS[displaySize]}
            </span>
          </div>
          {selectedCategory && (
            <div className="flex items-center gap-2">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: selectedCategory.color ?? 'var(--color-accent)' }}
              />
              <span className="text-[13.5px] font-medium tracking-[0.2em] text-[var(--color-text-muted)] uppercase">
                {selectedCategory.name}
              </span>
            </div>
          )}
          <h3
            className={cn(
              titleFontClass,
              'leading-tight font-semibold text-[var(--color-text-primary)]'
            )}
            style={{ fontSize: CARD_TITLE_SIZES[displaySize] }}
          >
            {title || 'Untitled Announcement'}
          </h3>
          <p
            className="line-clamp-3 leading-relaxed text-[var(--color-text-secondary)]"
            style={{ fontSize: DETAIL_BODY_SIZES[displaySize] }}
          >
            {body || 'Announcement body will appear here...'}
          </p>
          {registrationLink && !urlError && (
            <span className="inline-block text-[15px] font-medium tracking-wider text-[var(--color-accent)] uppercase">
              Register Here →
            </span>
          )}
        </div>
      </GlassCard>
    </section>
  )
}

// ─── Component ───────────────────────────────────────────────

export function AnnouncementForm({
  initialData,
  categories,
  organizationId,
  onSave,
  onPublish,
  onSaveAndPublish,
  onUnpublish,
  onDelete,
  isNew = false,
  backHref = '/dashboard/announcements',
}: AnnouncementFormProps) {
  const [isPending, startTransition] = useTransition()

  // Form state
  const [title, setTitle] = useState(() => initialData.title)
  const [body, setBody] = useState(() => initialData.body)
  const [categoryId, setCategoryId] = useState(initialData.category_id ?? '')
  const [bannerUrl, setBannerUrl] = useState(initialData.banner_url ?? '')
  const [registrationLink, setRegistrationLink] = useState(initialData.registration_link ?? '')
  const [expiresAt, setExpiresAt] = useState(() => toDateInputValue(initialData.expires_at))
  const [scheduledPublishAt, setScheduledPublishAt] = useState(() =>
    toDateTimeLocalInputValue(initialData.scheduled_publish_at)
  )
  const [pinnedUntil, setPinnedUntil] = useState(() =>
    toDateTimeLocalInputValue(initialData.pinned_until)
  )
  const [status, setStatus] = useState<PostStatus>(() => initialData.status)
  const [urgency, setUrgency] = useState<AnnouncementUrgency>(() => initialData.urgency)
  const [displayFont, setDisplayFont] = useState<AnnouncementDisplayFont>(
    () => initialData.display_font
  )
  const [displaySize, setDisplaySize] = useState<AnnouncementDisplaySize>(
    () => initialData.display_size
  )

  // UI state
  const [saveState, setSaveState] = useState<AutosaveStatus>('idle')
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [urlError, setUrlError] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [bannerSizeError, setBannerSizeError] = useState(false)
  const [bannerUploadError, setBannerUploadError] = useState('')
  const [formError, setFormError] = useState('')

  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const lastSaveRef = useRef(0)
  const dirtyRef = useRef(false)
  // Stable ref so the autosave interval always calls the latest handleSave
  const handleSaveRef = useRef<() => Promise<void>>(async () => {})

  if (lastSaveRef.current === 0) {
    lastSaveRef.current = Date.now()
  }

  // Track dirty state
  useEffect(() => {
    dirtyRef.current = true
  }, [
    title,
    body,
    categoryId,
    bannerUrl,
    registrationLink,
    expiresAt,
    scheduledPublishAt,
    pinnedUntil,
    urgency,
    displayFont,
    displaySize,
  ])

  // Auto-grow textarea
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.style.height = 'auto'
      bodyRef.current.style.height = bodyRef.current.scrollHeight + 'px'
    }
  }, [body])

  // Keep ref in sync so the interval always calls the latest handleSave closure
  useEffect(() => {
    handleSaveRef.current = handleSave
  })

  // Autosave every 30 seconds if dirty
  useEffect(() => {
    if (isNew) return // Don't autosave new (unsaved) announcements

    const interval = setInterval(() => {
      if (dirtyRef.current && Date.now() - lastSaveRef.current > 30000) {
        void handleSaveRef.current()
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [isNew])

  // Build FormData from state
  const buildFormData = useCallback(() => {
    const fd = new FormData()
    fd.set('title', title)
    fd.set('body', body)
    if (categoryId) fd.set('category_id', categoryId)
    if (bannerUrl) fd.set('banner_url', bannerUrl)
    if (registrationLink) fd.set('registration_link', registrationLink)
    if (expiresAt) fd.set('expires_at', new Date(expiresAt).toISOString())
    if (scheduledPublishAt)
      fd.set('scheduled_publish_at', new Date(scheduledPublishAt).toISOString())
    if (pinnedUntil) fd.set('pinned_until', new Date(pinnedUntil).toISOString())
    fd.set('urgency', urgency)
    fd.set('display_font', displayFont)
    fd.set('display_size', displaySize)
    return fd
  }, [
    title,
    body,
    categoryId,
    bannerUrl,
    registrationLink,
    expiresAt,
    scheduledPublishAt,
    pinnedUntil,
    urgency,
    displayFont,
    displaySize,
  ])

  const analyticsProperties = useCallback(
    (nextStatus: PostStatus = status) => ({
      announcement_id: initialData.id ?? null,
      status: nextStatus,
      is_new: isNew,
      has_banner: Boolean(bannerUrl),
      has_category: Boolean(categoryId),
      has_registration_link: Boolean(registrationLink),
      has_expiry: Boolean(expiresAt),
      is_scheduled: Boolean(scheduledPublishAt),
      is_pinned: Boolean(pinnedUntil),
      urgency,
      display_font: displayFont,
      display_size: displaySize,
    }),
    [
      initialData.id,
      status,
      isNew,
      bannerUrl,
      categoryId,
      registrationLink,
      expiresAt,
      scheduledPublishAt,
      pinnedUntil,
      urgency,
      displayFont,
      displaySize,
    ]
  )

  // ─── Handlers ────────────────────────────────────────────────

  function clearFormErrorOnEdit() {
    setFormError((current) => (current ? '' : current))
  }

  async function handleSave() {
    setFormError('')
    const hasTimingError =
      Boolean(futureDateTimeError(scheduledPublishAt, 'Publish time')) ||
      Boolean(futureDateTimeError(pinnedUntil, 'Pin end time')) ||
      Boolean(futureDateTimeError(expiresAt, 'Expiry date'))
    if (hasTimingError) {
      setFormError(
        futureDateTimeError(scheduledPublishAt, 'Publish time') ||
          futureDateTimeError(pinnedUntil, 'Pin end time') ||
          futureDateTimeError(expiresAt, 'Expiry date')
      )
      setSaveState('error')
      return
    }

    setIsSaving(true)
    setSaveState('saving')
    try {
      const fd = buildFormData()
      await onSave(fd)
      setSaveState('saved')
      dirtyRef.current = false
      lastSaveRef.current = Date.now()
      captureProductEvent('publisher_announcement_saved', analyticsProperties())
    } catch (error) {
      unstable_rethrow(error)
      reportClientError('announcement_form.save', error)
      setFormError(error instanceof Error ? error.message : 'Could not save announcement.')
      setSaveState('error')
    } finally {
      setIsSaving(false)
    }
  }

  async function handlePublish() {
    setFormError('')
    const readyError = getReadyForReviewError()
    if (readyError) {
      setFormError(readyError)
      setSaveState('error')
      return
    }

    const hasTimingError =
      Boolean(futureDateTimeError(scheduledPublishAt, 'Publish time')) ||
      Boolean(futureDateTimeError(pinnedUntil, 'Pin end time')) ||
      Boolean(futureDateTimeError(expiresAt, 'Expiry date'))
    if (hasTimingError) {
      setFormError(
        futureDateTimeError(scheduledPublishAt, 'Publish time') ||
          futureDateTimeError(pinnedUntil, 'Pin end time') ||
          futureDateTimeError(expiresAt, 'Expiry date')
      )
      setSaveState('error')
      return
    }

    setIsPublishing(true)
    setSaveState('saving')
    try {
      const fd = buildFormData()
      captureProductEvent('publisher_announcement_submitted', analyticsProperties('submitted'))
      if (isNew && onSaveAndPublish) {
        await onSaveAndPublish(fd)
      } else {
        await onSave(fd)
        if (onPublish) await onPublish()
        setStatus('published')
        setSaveState('saved')
        dirtyRef.current = false
      }
    } catch (error) {
      unstable_rethrow(error)
      reportClientError('announcement_form.submit', error)
      setFormError(error instanceof Error ? error.message : 'Could not submit announcement.')
      setSaveState('error')
    } finally {
      setIsPublishing(false)
    }
  }

  async function handleUnpublish() {
    if (!onUnpublish) return
    setIsPublishing(true)
    try {
      await onUnpublish()
      setStatus('draft')
      setSaveState('saved')
      captureProductEvent('publisher_announcement_unpublished', analyticsProperties('draft'))
    } catch (error) {
      unstable_rethrow(error)
      reportClientError('announcement_form.unpublish', error)
      setFormError(error instanceof Error ? error.message : 'Could not update announcement.')
      setSaveState('error')
    } finally {
      setIsPublishing(false)
    }
  }

  async function handleDelete(closeAfterError: () => void) {
    if (!onDelete) return
    startTransition(async () => {
      try {
        captureProductEvent('publisher_announcement_deleted', analyticsProperties())
        await onDelete()
      } catch (error) {
        unstable_rethrow(error)
        reportClientError('announcement_form.delete', error)
        setFormError(error instanceof Error ? error.message : 'Could not delete announcement.')
        setSaveState('error')
        closeAfterError()
      }
    })
  }

  function handleUrlBlur() {
    if (registrationLink && !isValidUrl(registrationLink)) {
      setUrlError('Please enter a valid http or https URL (e.g. https://forms.google.com/...)')
    } else {
      setUrlError('')
    }
  }

  function getReadyForReviewError(): string {
    if (!title.trim()) return 'Add a title before submitting for review.'
    if (!body.trim()) return 'Add announcement body before submitting for review.'
    return ''
  }

  // ─── Banner upload ───────────────────────────────────────────

  async function uploadBanner(file: File) {
    setBannerSizeError(false)
    setBannerUploadError('')
    if (file.size > BANNER_MAX_FILE_SIZE_BYTES) {
      setBannerSizeError(true)
      return
    }
    setIsUploading(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) throw new Error('Sign in again before uploading an image.')

      const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
      const organizationSegment = organizationId ?? 'unassigned'
      const path = `${user.id}/${organizationSegment}/${crypto.randomUUID()}.${ext || 'jpg'}`

      const { error: uploadError } = await supabase.storage.from('banner-images').upload(path, file)

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from('banner-images').getPublicUrl(path)

      setBannerUrl(publicUrl)
      captureProductEvent('publisher_banner_uploaded', {
        file_size: file.size,
        file_type: file.type || null,
        organization_id: organizationId ?? null,
      })
    } catch (error) {
      reportClientError('announcement_form.banner_upload', error, {
        fileSize: file.size,
        fileType: file.type || null,
        organizationId: organizationId ?? null,
      })
      setBannerUploadError('Upload failed. Try another image or sign in again.')
    } finally {
      setIsUploading(false)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) uploadBanner(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) uploadBanner(file)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(true)
  }

  function removeBanner() {
    setBannerUrl('')
    captureProductEvent('publisher_banner_removed', analyticsProperties())
  }

  const selectedCategory = categories.find((c) => c.id === categoryId)
  const isScheduled = isFutureDateTime(scheduledPublishAt)
  const isPinned = isFutureDateTime(pinnedUntil)
  const scheduledPublishError = futureDateTimeError(scheduledPublishAt, 'Publish time')
  const pinnedUntilError = futureDateTimeError(pinnedUntil, 'Pin end time')
  const expiresAtError = futureDateTimeError(expiresAt, 'Expiry date')

  // ─── Render ──────────────────────────────────────────────────

  const isPublished = status === 'published'
  const displayStatus = (status === 'expired' ? 'archived' : status) as
    | 'draft'
    | 'submitted'
    | 'published'
    | 'rejected'
    | 'archived'
  const actionBar = (
    <ActionBar
      status={displayStatus}
      saveState={saveState}
      isPublished={isPublished}
      onSaveDraft={handleSave}
      onPublish={handlePublish}
      onUnpublish={isPublished ? handleUnpublish : undefined}
      isSaving={isSaving}
      isPublishing={isPublishing}
      saveLabel={status === 'draft' ? 'Save Draft' : 'Save Changes'}
      publishLabel={isScheduled ? 'Submit Scheduled' : 'Submit for Review'}
      sticky={!isNew}
    />
  )

  return (
    <div className="announcement-form-shell">
      {/* Top bar with back button + delete */}
      {!isNew && (
        <AnnouncementFormTopBar
          backHref={backHref}
          isPending={isPending}
          onDelete={onDelete ? handleDelete : undefined}
        />
      )}

      {/* Form content */}
      <div className="announcement-editor-layout mx-auto w-full max-w-[82rem] flex-1 px-4 pb-28 sm:px-6 lg:px-8">
        <div className="announcement-editor-main">
          {status === 'rejected' && initialData.rejection_comment && (
            <div className="rounded-2xl border border-[var(--color-status-rejected-text)]/25 bg-[var(--color-status-rejected-bg)] p-4">
              <div className="flex gap-3">
                <AlertTriangle
                  size={18}
                  className="mt-0.5 flex-shrink-0 text-[var(--color-status-rejected-text)]"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm font-semibold text-[var(--color-status-rejected-text)]">
                    Changes requested
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">
                    {initialData.rejection_comment}
                  </p>
                </div>
              </div>
            </div>
          )}

          <section className="announcement-section-card space-y-7 p-5 sm:p-6">
            <div>
              <p className="future-kicker">Write the notice first</p>
              <h2 className="font-display mt-3 text-2xl leading-tight font-extrabold text-[var(--color-text-primary)]">
                Message details
              </h2>
              <p className="mt-2 max-w-[56ch] text-sm leading-6 text-[var(--color-text-secondary)]">
                Keep the core message clear before adding visual style or publishing timing.
              </p>
            </div>

            {/* Title */}
            <div>
              <div className="mb-1 flex items-end justify-between">
                <label
                  htmlFor="announcement-title"
                  className="text-xs font-medium tracking-widest text-[var(--color-text-muted)] uppercase"
                >
                  Title
                </label>
                <span className="font-mono text-[15px] text-[var(--color-text-muted)]">
                  {title.length}/{ANNOUNCEMENT_TITLE_MAX}
                </span>
              </div>
              <input
                id="announcement-title"
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value.slice(0, ANNOUNCEMENT_TITLE_MAX))
                  clearFormErrorOnEdit()
                }}
                placeholder="Announcement title"
                className={cn(
                  'w-full py-3 text-xl font-semibold',
                  'bg-transparent text-[var(--color-text-primary)]',
                  'placeholder:text-[var(--color-text-muted)]',
                  'border-0 border-b border-[var(--color-glass-border)]',
                  'focus:border-[var(--color-accent)] focus:outline-none',
                  'transition-colors duration-200'
                )}
              />
            </div>

            {/* Body */}
            <div>
              <label
                htmlFor="announcement-body"
                className="mb-1 block text-xs font-medium tracking-widest text-[var(--color-text-muted)] uppercase"
              >
                Body
              </label>
              <textarea
                id="announcement-body"
                ref={bodyRef}
                value={body}
                onChange={(e) => {
                  setBody(e.target.value.slice(0, ANNOUNCEMENT_BODY_MAX))
                  clearFormErrorOnEdit()
                }}
                placeholder="Write the announcement body…"
                rows={6}
                maxLength={ANNOUNCEMENT_BODY_MAX}
                aria-describedby="announcement-body-count"
                className={cn(
                  'w-full resize-none py-3 text-base leading-relaxed',
                  'bg-transparent text-[var(--color-text-primary)]',
                  'placeholder:text-[var(--color-text-muted)]',
                  'border-0 border-b border-[var(--color-glass-border)]',
                  'focus:border-[var(--color-accent)] focus:outline-none',
                  'transition-colors duration-200'
                )}
              />
              <div
                id="announcement-body-count"
                className="mt-1.5 text-right font-mono text-[15px] text-[var(--color-text-muted)]"
              >
                {body.length}/{ANNOUNCEMENT_BODY_MAX}
              </div>
            </div>

            {formError && (
              <div
                role="alert"
                className="rounded-2xl border border-[var(--color-destructive)]/25 bg-[var(--color-status-rejected-bg)] px-4 py-3 text-sm font-semibold text-[var(--color-destructive)]"
              >
                {formError}
              </div>
            )}
          </section>

          <section className="announcement-section-card space-y-7 p-5 sm:p-6">
            <div>
              <p className="future-kicker">Appearance and details</p>
              <h2 className="font-display mt-3 text-2xl leading-tight font-extrabold text-[var(--color-text-primary)]">
                How it appears
              </h2>
              <p className="mt-2 max-w-[56ch] text-sm leading-6 text-[var(--color-text-secondary)]">
                Add category, visual emphasis, poster image, and registration details only when they
                help students act.
              </p>
            </div>

            {/* Category */}
            <div>
              <label
                htmlFor="announcement-category"
                className="mb-2 block text-xs font-medium tracking-widest text-[var(--color-text-muted)] uppercase"
              >
                Category
              </label>
              <div className="relative">
                {selectedCategory && (
                  <span
                    className="pointer-events-none absolute top-1/2 left-4 z-10 size-2.5 -translate-y-1/2 rounded-full"
                    style={{ backgroundColor: selectedCategory.color ?? 'var(--color-accent)' }}
                    aria-hidden="true"
                  />
                )}
                <select
                  id="announcement-category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className={cn(
                    'min-h-12 w-full rounded-xl border px-4 py-3 text-sm',
                    selectedCategory ? 'pl-9' : 'pl-4',
                    'border-[var(--color-glass-border)] bg-[var(--color-glass-bg)] text-[var(--color-text-primary)] backdrop-blur-sm',
                    'transition-all duration-200 outline-none',
                    'hover:border-[var(--color-accent)]/40 focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/30'
                  )}
                >
                  <option value="">None</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Urgency */}
            <fieldset className="min-w-0 border-0 p-0">
              <legend className="mb-2 flex items-center gap-2 p-0 text-xs font-medium tracking-widest text-[var(--color-text-muted)] uppercase">
                <AlertTriangle
                  size={14}
                  className="text-[var(--color-text-muted)]"
                  aria-hidden="true"
                />
                Urgency
              </legend>
              <div className="grid grid-cols-3 gap-2">
                {ANNOUNCEMENT_URGENCIES.map((option) => {
                  const meta = URGENCY_META[option]
                  const active = urgency === option
                  return (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setUrgency(option)}
                      className={cn(
                        'min-h-11 rounded-xl border px-3 text-sm font-semibold transition-all duration-200',
                        'focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:outline-none',
                        active
                          ? 'border-[var(--color-accent)] bg-[var(--color-accent-surface)] text-[var(--color-text-primary)]'
                          : 'border-[var(--color-glass-border)] bg-[var(--color-glass-bg)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]/40'
                      )}
                    >
                      <span style={{ color: active ? meta.tone : undefined }}>{meta.label}</span>
                    </button>
                  )
                })}
              </div>
            </fieldset>

            {/* Typography */}
            <div className="grid gap-4">
              <fieldset className="min-w-0 border-0 p-0">
                <legend className="mb-2 flex items-center gap-2 p-0 text-xs font-medium tracking-widest text-[var(--color-text-muted)] uppercase">
                  <Type size={14} className="text-[var(--color-text-muted)]" aria-hidden="true" />
                  Font
                </legend>
                <div className="grid grid-cols-2 gap-2">
                  {ANNOUNCEMENT_DISPLAY_FONTS.map((option) => {
                    const active = displayFont === option
                    return (
                      <button
                        key={option}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setDisplayFont(option)}
                        className={cn(
                          'min-h-11 rounded-xl border px-3 text-sm font-semibold transition-all duration-200',
                          'focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:outline-none',
                          active
                            ? 'border-[var(--color-accent)] bg-[var(--color-accent-surface)] text-[var(--color-text-primary)]'
                            : 'border-[var(--color-glass-border)] bg-[var(--color-glass-bg)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]/40'
                        )}
                      >
                        <span className={getAnnouncementTitleFontClass(option)}>
                          {DISPLAY_FONT_LABELS[option]}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </fieldset>

              <fieldset className="min-w-0 border-0 p-0">
                <legend className="mb-2 block p-0 text-xs font-medium tracking-widest text-[var(--color-text-muted)] uppercase">
                  Text Size
                </legend>
                <div className="grid grid-cols-3 gap-2">
                  {ANNOUNCEMENT_DISPLAY_SIZES.map((option) => {
                    const active = displaySize === option
                    return (
                      <button
                        key={option}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setDisplaySize(option)}
                        className={cn(
                          'min-h-11 rounded-xl border px-3 text-sm font-semibold whitespace-nowrap transition-all duration-200',
                          'focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:outline-none',
                          active
                            ? 'border-[var(--color-accent)] bg-[var(--color-accent-surface)] text-[var(--color-text-primary)]'
                            : 'border-[var(--color-glass-border)] bg-[var(--color-glass-bg)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]/40'
                        )}
                      >
                        {DISPLAY_SIZE_LABELS[option]}
                      </button>
                    )
                  })}
                </div>
              </fieldset>
            </div>

            {/* Banner Image Upload */}
            <div>
              <label
                htmlFor="banner-image-upload"
                className="mb-2 block text-xs font-medium tracking-widest text-[var(--color-text-muted)] uppercase"
              >
                Banner Image
              </label>

              {bannerUrl ? (
                <div className="relative overflow-hidden rounded-xl border border-[var(--color-glass-border)]">
                  <NextImage
                    src={bannerUrl}
                    alt="Banner preview"
                    width={720}
                    height={192}
                    className="h-48 w-full object-contain"
                    unoptimized
                  />
                  <button
                    type="button"
                    onClick={removeBanner}
                    className="absolute top-3 right-3 flex min-h-11 items-center gap-1.5 rounded-lg bg-[color-mix(in_oklab,var(--color-text-primary)_62%,transparent)] px-3 text-xs font-medium text-[var(--color-canvas)] backdrop-blur-sm transition-colors hover:bg-[color-mix(in_oklab,var(--color-text-primary)_76%,transparent)]"
                  >
                    <X size={12} />
                    Remove
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={() => setIsDragOver(false)}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  aria-describedby={
                    bannerSizeError || bannerUploadError ? 'banner-image-upload-error' : undefined
                  }
                  className={cn(
                    'flex w-full flex-col items-center justify-center gap-3 rounded-xl py-12 text-center',
                    'border-2 border-dashed transition-all duration-200',
                    'focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:outline-none',
                    isUploading && 'cursor-wait opacity-80',
                    isDragOver
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-surface)]'
                      : 'border-[var(--color-glass-border)] hover:border-[var(--color-accent)]/40 hover:bg-[var(--color-surface-elevated)]'
                  )}
                >
                  <Upload
                    size={24}
                    className={cn(
                      'text-[var(--color-text-muted)]',
                      isDragOver && 'text-[var(--color-accent)]'
                    )}
                  />
                  <div className="text-center">
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      {isUploading ? 'Uploading…' : 'Drop an image here or click to upload'}
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                      JPG, PNG, or WebP, max {BANNER_MAX_FILE_SIZE_MB}MB
                    </p>
                    {(bannerSizeError || bannerUploadError) && (
                      <div
                        id="banner-image-upload-error"
                        role="alert"
                        aria-live="polite"
                        className="mt-1 text-xs font-semibold text-[var(--color-destructive)]"
                      >
                        {bannerSizeError && (
                          <p>
                            File exceeds {BANNER_MAX_FILE_SIZE_MB} MB limit. Choose a smaller image.
                          </p>
                        )}
                        {bannerUploadError && <p>{bannerUploadError}</p>}
                      </div>
                    )}
                  </div>
                </button>
              )}

              <input
                id="banner-image-upload"
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                aria-label="Upload banner image"
                aria-invalid={bannerSizeError || Boolean(bannerUploadError)}
                aria-describedby={
                  bannerSizeError || bannerUploadError ? 'banner-image-upload-error' : undefined
                }
                className="hidden"
              />
            </div>

            {/* Registration Link */}
            <div>
              <label
                htmlFor="registration-link"
                className="mb-1 block text-xs font-medium tracking-widest text-[var(--color-text-muted)] uppercase"
              >
                Registration Link <span className="tracking-normal normal-case">(optional)</span>
              </label>
              <div className="relative">
                <Link2
                  size={16}
                  className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[var(--color-text-muted)]"
                />
                <input
                  id="registration-link"
                  type="url"
                  value={registrationLink}
                  onChange={(e) => {
                    setRegistrationLink(e.target.value)
                    setUrlError('')
                    clearFormErrorOnEdit()
                  }}
                  onBlur={handleUrlBlur}
                  aria-invalid={Boolean(urlError)}
                  aria-describedby={urlError ? 'registration-link-error' : undefined}
                  placeholder="https://forms.google.com/..."
                  className={cn(
                    'w-full rounded-xl py-3 pr-4 pl-9 text-sm',
                    'bg-transparent text-[var(--color-text-primary)]',
                    'placeholder:text-[var(--color-text-muted)]',
                    'border transition-all duration-200',
                    urlError
                      ? 'border-[var(--color-destructive)] focus:ring-[var(--color-destructive)]/30'
                      : 'border-[var(--color-glass-border)] focus:border-[var(--color-accent)]',
                    'focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:outline-none'
                  )}
                />
              </div>
              {urlError && (
                <p
                  id="registration-link-error"
                  role="alert"
                  aria-live="polite"
                  className="mt-1.5 text-xs text-[var(--color-destructive)]"
                >
                  {urlError}
                </p>
              )}
            </div>
          </section>
        </div>

        <aside className="announcement-editor-aside">
          <section className="announcement-section-card announcement-publishing-panel space-y-6 p-5 sm:p-6">
            <div>
              <p className="future-kicker">Publishing</p>
              <h2 className="font-display mt-3 text-2xl leading-tight font-extrabold text-[var(--color-text-primary)]">
                Timing and visibility
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                Leave timing blank for a normal review flow, or schedule when the notice should
                appear.
              </p>
            </div>

            {/* Publishing Controls */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div>
                <label
                  htmlFor="scheduled-publish-at"
                  className="mb-1 block text-xs font-medium tracking-widest text-[var(--color-text-muted)] uppercase"
                >
                  Schedule for later <span className="tracking-normal normal-case">(optional)</span>
                </label>
                <div className="relative">
                  <Clock
                    size={16}
                    className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[var(--color-text-muted)]"
                  />
                  <input
                    id="scheduled-publish-at"
                    type="datetime-local"
                    value={scheduledPublishAt}
                    onChange={(e) => {
                      setScheduledPublishAt(e.target.value)
                      clearFormErrorOnEdit()
                    }}
                    aria-invalid={Boolean(scheduledPublishError)}
                    aria-describedby={
                      scheduledPublishError
                        ? 'scheduled-publish-at-error scheduled-publish-at-help'
                        : 'scheduled-publish-at-help'
                    }
                    className={cn(
                      'w-full rounded-xl py-3 pr-4 pl-9 text-sm',
                      'bg-transparent text-[var(--color-text-primary)]',
                      'border',
                      scheduledPublishError
                        ? 'border-[var(--color-destructive)] focus:ring-[var(--color-destructive)]/30'
                        : 'border-[var(--color-glass-border)] focus:border-[var(--color-accent)] focus:ring-[var(--color-accent)]/30',
                      'focus:ring-2 focus:outline-none',
                      'transition-all duration-200'
                    )}
                  />
                </div>
                {scheduledPublishError && (
                  <p
                    id="scheduled-publish-at-error"
                    className="mt-1.5 text-xs text-[var(--color-destructive)]"
                  >
                    {scheduledPublishError}
                  </p>
                )}
                <p
                  id="scheduled-publish-at-help"
                  className="mt-1.5 text-xs text-[var(--color-text-muted)]"
                >
                  Leave blank to go live right after approval.
                </p>
              </div>

              <div>
                <label
                  htmlFor="pinned-until"
                  className="mb-1 block text-xs font-medium tracking-widest text-[var(--color-text-muted)] uppercase"
                >
                  Pin Until <span className="tracking-normal normal-case">(optional)</span>
                </label>
                <div className="relative">
                  <Pin
                    size={16}
                    className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[var(--color-text-muted)]"
                  />
                  <input
                    id="pinned-until"
                    type="datetime-local"
                    value={pinnedUntil}
                    onChange={(e) => {
                      setPinnedUntil(e.target.value)
                      clearFormErrorOnEdit()
                    }}
                    aria-invalid={Boolean(pinnedUntilError)}
                    aria-describedby={
                      pinnedUntilError
                        ? 'pinned-until-error pinned-until-help'
                        : 'pinned-until-help'
                    }
                    className={cn(
                      'w-full rounded-xl py-3 pr-4 pl-9 text-sm',
                      'bg-transparent text-[var(--color-text-primary)]',
                      'border',
                      pinnedUntilError
                        ? 'border-[var(--color-destructive)] focus:ring-[var(--color-destructive)]/30'
                        : 'border-[var(--color-glass-border)] focus:border-[var(--color-accent)] focus:ring-[var(--color-accent)]/30',
                      'focus:ring-2 focus:outline-none',
                      'transition-all duration-200'
                    )}
                  />
                </div>
                {pinnedUntilError && (
                  <p
                    id="pinned-until-error"
                    className="mt-1.5 text-xs text-[var(--color-destructive)]"
                  >
                    {pinnedUntilError}
                  </p>
                )}
                <p id="pinned-until-help" className="mt-1.5 text-xs text-[var(--color-text-muted)]">
                  Pinned posts stay first on the public board.
                </p>
              </div>
            </div>

            {/* Expires At */}
            <div>
              <label
                htmlFor="expires-at"
                className="mb-1 block text-xs font-medium tracking-widest text-[var(--color-text-muted)] uppercase"
              >
                Expiry Date <span className="tracking-normal normal-case">(optional)</span>
              </label>
              <div className="relative">
                <Calendar
                  size={16}
                  className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[var(--color-text-muted)]"
                />
                <input
                  id="expires-at"
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  aria-invalid={Boolean(expiresAtError)}
                  aria-describedby={expiresAtError ? 'expires-at-error' : undefined}
                  className={cn(
                    'w-full rounded-xl py-3 pr-4 pl-9 text-sm',
                    'bg-transparent text-[var(--color-text-primary)]',
                    'border',
                    expiresAtError
                      ? 'border-[var(--color-destructive)] focus:ring-[var(--color-destructive)]/30'
                      : 'border-[var(--color-glass-border)] focus:border-[var(--color-accent)] focus:ring-[var(--color-accent)]/30',
                    'focus:ring-2 focus:outline-none',
                    'transition-all duration-200'
                  )}
                />
              </div>
              {expiresAtError && (
                <p
                  id="expires-at-error"
                  role="alert"
                  className="mt-1.5 text-xs text-[var(--color-destructive)]"
                >
                  {expiresAtError}
                </p>
              )}
            </div>
          </section>

          <PublishingReadinessChecklist />

          <AnnouncementLivePreview
            bannerUrl={bannerUrl}
            urgency={urgency}
            isScheduled={isScheduled}
            isPinned={isPinned}
            displayFont={displayFont}
            displaySize={displaySize}
            selectedCategory={selectedCategory}
            title={title}
            body={body}
            registrationLink={registrationLink}
            urlError={urlError}
          />
        </aside>
      </div>

      {isNew ? (
        <div className="announcement-static-actionbar mx-auto w-full max-w-[82rem] px-4 pb-8 sm:px-6 lg:px-8">
          {actionBar}
        </div>
      ) : (
        actionBar
      )}
    </div>
  )
}
