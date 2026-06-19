'use client'

import { useReducer, useEffect, useRef, useCallback, useTransition } from 'react'
import { unstable_rethrow } from 'next/navigation'
import NextImage from 'next/image'
import { AlertTriangle, Calendar, Clock, Link2, Pin, Type, Upload, X } from 'lucide-react'
import { cn } from '@/shared/utils'
import { ActionBar } from './ActionBar'
import type { AutosaveStatus } from './AutosaveIndicator'
import { AnnouncementFormTopBar } from './AnnouncementFormTopBar'
import { AnnouncementLivePreview } from './AnnouncementLivePreview'
import { PublishingReadinessChecklist } from './PublishingReadinessChecklist'
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
  isDragOver: boolean
  isUploading: boolean
  bannerSizeError: boolean
  bannerUploadError: string
  formError: string
}

type AnnouncementFormAction = {
  type: 'patch'
  values: Partial<AnnouncementFormState>
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

function createAnnouncementFormState(initialData: AnnouncementFormData): AnnouncementFormState {
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
    isDragOver: false,
    isUploading: false,
    bannerSizeError: false,
    bannerUploadError: '',
    formError: '',
  }
}

function announcementFormReducer(
  state: AnnouncementFormState,
  action: AnnouncementFormAction
): AnnouncementFormState {
  switch (action.type) {
    case 'patch':
      return { ...state, ...action.values }
  }
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

// ─── Component ───────────────────────────────────────────────

function useAnnouncementFormController({
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
  const [state, dispatch] = useReducer(
    announcementFormReducer,
    initialData,
    createAnnouncementFormState
  )
  const {
    title,
    body,
    categoryId,
    bannerUrl,
    registrationLink,
    expiresAt,
    scheduledPublishAt,
    pinnedUntil,
    status,
    urgency,
    displayFont,
    displaySize,
    saveState,
    isSaving,
    isPublishing,
    urlError,
    isDragOver,
    isUploading,
    bannerSizeError,
    bannerUploadError,
    formError,
  } = state

  function patchState(values: Partial<AnnouncementFormState>) {
    dispatch({ type: 'patch', values })
  }

  function setTitle(value: string) {
    patchState({ title: value })
  }

  function setBody(value: string) {
    patchState({ body: value })
  }

  function setCategoryId(value: string) {
    patchState({ categoryId: value })
  }

  function setBannerUrl(value: string) {
    patchState({ bannerUrl: value })
  }

  function setRegistrationLink(value: string) {
    patchState({ registrationLink: value })
  }

  function setExpiresAt(value: string) {
    patchState({ expiresAt: value })
  }

  function setScheduledPublishAt(value: string) {
    patchState({ scheduledPublishAt: value })
  }

  function setPinnedUntil(value: string) {
    patchState({ pinnedUntil: value })
  }

  function setStatus(value: PostStatus) {
    patchState({ status: value })
  }

  function setUrgency(value: AnnouncementUrgency) {
    patchState({ urgency: value })
  }

  function setDisplayFont(value: AnnouncementDisplayFont) {
    patchState({ displayFont: value })
  }

  function setDisplaySize(value: AnnouncementDisplaySize) {
    patchState({ displaySize: value })
  }

  function setSaveState(value: AutosaveStatus) {
    patchState({ saveState: value })
  }

  function setIsSaving(value: boolean) {
    patchState({ isSaving: value })
  }

  function setIsPublishing(value: boolean) {
    patchState({ isPublishing: value })
  }

  function setUrlError(value: string) {
    patchState({ urlError: value })
  }

  function setIsDragOver(value: boolean) {
    patchState({ isDragOver: value })
  }

  function setIsUploading(value: boolean) {
    patchState({ isUploading: value })
  }

  function setBannerSizeError(value: boolean) {
    patchState({ bannerSizeError: value })
  }

  function setBannerUploadError(value: string) {
    patchState({ bannerUploadError: value })
  }

  function setFormError(value: string) {
    patchState({ formError: value })
  }

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
    if (formError) setFormError('')
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

  return {
    actionBar,
    backHref,
    bannerSizeError,
    bannerUploadError,
    bannerUrl,
    body,
    bodyRef,
    categories,
    categoryId,
    clearFormErrorOnEdit,
    displayFont,
    displaySize,
    expiresAt,
    expiresAtError,
    fileInputRef,
    formError,
    handleDelete,
    handleDragOver,
    handleDrop,
    handleFileChange,
    handleUrlBlur,
    initialData,
    isDragOver,
    isNew,
    isPending,
    isPinned,
    isScheduled,
    isUploading,
    onDelete,
    pinnedUntil,
    pinnedUntilError,
    registrationLink,
    removeBanner,
    scheduledPublishAt,
    scheduledPublishError,
    selectedCategory,
    setBody,
    setCategoryId,
    setDisplayFont,
    setDisplaySize,
    setExpiresAt,
    setIsDragOver,
    setPinnedUntil,
    setRegistrationLink,
    setScheduledPublishAt,
    setTitle,
    setUrgency,
    setUrlError,
    status,
    title,
    urgency,
    urlError,
  }
}

type AnnouncementFormViewProps = ReturnType<typeof useAnnouncementFormController>

function renderAnnouncementFormView({
  actionBar,
  backHref,
  bannerSizeError,
  bannerUploadError,
  bannerUrl,
  body,
  bodyRef,
  categories,
  categoryId,
  clearFormErrorOnEdit,
  displayFont,
  displaySize,
  expiresAt,
  expiresAtError,
  fileInputRef,
  formError,
  handleDelete,
  handleDragOver,
  handleDrop,
  handleFileChange,
  handleUrlBlur,
  initialData,
  isDragOver,
  isNew,
  isPending,
  isPinned,
  isScheduled,
  isUploading,
  onDelete,
  pinnedUntil,
  pinnedUntilError,
  registrationLink,
  removeBanner,
  scheduledPublishAt,
  scheduledPublishError,
  selectedCategory,
  setBody,
  setCategoryId,
  setDisplayFont,
  setDisplaySize,
  setExpiresAt,
  setIsDragOver,
  setPinnedUntil,
  setRegistrationLink,
  setScheduledPublishAt,
  setTitle,
  setUrgency,
  setUrlError,
  status,
  title,
  urgency,
  urlError,
}: AnnouncementFormViewProps) {
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

export function AnnouncementForm(props: AnnouncementFormProps) {
  return renderAnnouncementFormView(useAnnouncementFormController(props))
}
