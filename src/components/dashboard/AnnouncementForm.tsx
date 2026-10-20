'use client'

import { useReducer, useEffect, useRef, useCallback, useTransition } from 'react'
import { unstable_rethrow } from 'next/navigation'
import { AlertTriangle, Link2, Type } from 'lucide-react'
import { cn } from '@/shared/utils'
import { ActionBar } from './ActionBar'
import type { AutosaveStatus } from './AutosaveIndicator'
import { AnnouncementFormTopBar } from './AnnouncementFormTopBar'
import { AnnouncementLivePreview } from './AnnouncementLivePreview'
import { AnnouncementScheduleFields } from './AnnouncementScheduleFields'
import { BannerImageField } from './BannerImageField'
import { PublishingReadinessChecklist } from './PublishingReadinessChecklist'
import {
  announcementFormReducer,
  createAnnouncementFormState,
  futureDateTimeError,
  isFutureDateTime,
  isValidUrl,
  type AnnouncementFormData,
  type AnnouncementFormValues,
} from './announcement-form-state'
import type { PostStatus } from '@/shared/types'
import {
  ANNOUNCEMENT_BODY_MAX,
  ANNOUNCEMENT_TITLE_MAX,
  UNTITLED_ANNOUNCEMENT_TITLE,
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

export type { AnnouncementFormData }

type CategoryOption = {
  id: string
  name: string
  color: string | null
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
    formError,
  } = state

  function patchState(values: AnnouncementFormValues) {
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

  function setFormError(value: string) {
    patchState({ formError: value })
  }

  const bodyRef = useRef<HTMLTextAreaElement>(null)
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

  // The effect above also runs on mount; undo it so opening an announcement doesn't autosave it.
  useEffect(() => {
    dirtyRef.current = false
  }, [])

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
        // submitForReview moves the announcement to "submitted", not "published".
        setStatus('submitted')
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
    if (!title.trim() || title.trim() === UNTITLED_ANNOUNCEMENT_TITLE) {
      return 'Add a title before submitting for review.'
    }
    if (!body.trim()) return 'Add announcement body before submitting for review.'
    return ''
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
    formError,
    handleDelete,
    handleUrlBlur,
    initialData,
    isNew,
    isPending,
    isPinned,
    isScheduled,
    onDelete,
    organizationId,
    pinnedUntil,
    pinnedUntilError,
    registrationLink,
    removeBanner,
    scheduledPublishAt,
    scheduledPublishError,
    selectedCategory,
    setBannerUrl,
    setBody,
    setCategoryId,
    setDisplayFont,
    setDisplaySize,
    setExpiresAt,
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
  formError,
  handleDelete,
  handleUrlBlur,
  initialData,
  isNew,
  isPending,
  isPinned,
  isScheduled,
  onDelete,
  organizationId,
  pinnedUntil,
  pinnedUntilError,
  registrationLink,
  removeBanner,
  scheduledPublishAt,
  scheduledPublishError,
  selectedCategory,
  setBannerUrl,
  setBody,
  setCategoryId,
  setDisplayFont,
  setDisplaySize,
  setExpiresAt,
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

            <BannerImageField
              bannerUrl={bannerUrl}
              organizationId={organizationId}
              onChange={setBannerUrl}
              onRemove={removeBanner}
            />

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

            <AnnouncementScheduleFields
              scheduledPublishAt={scheduledPublishAt}
              scheduledPublishError={scheduledPublishError}
              onScheduledPublishAtChange={(value) => {
                setScheduledPublishAt(value)
                clearFormErrorOnEdit()
              }}
              pinnedUntil={pinnedUntil}
              pinnedUntilError={pinnedUntilError}
              onPinnedUntilChange={(value) => {
                setPinnedUntil(value)
                clearFormErrorOnEdit()
              }}
              expiresAt={expiresAt}
              expiresAtError={expiresAtError}
              onExpiresAtChange={setExpiresAt}
            />
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
