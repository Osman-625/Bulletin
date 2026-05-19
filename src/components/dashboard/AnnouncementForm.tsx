'use client'

import { useState, useEffect, useRef, useCallback, useTransition } from 'react'
import { unstable_rethrow, useRouter } from 'next/navigation'
import NextImage from 'next/image'
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Clock,
  Link2,
  Pin,
  Trash2,
  Type,
  Upload,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ActionBar } from './ActionBar'
import { GlassCard } from './GlassCard'
import type { AutosaveStatus } from './AutosaveIndicator'
import type { PostStatus } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { ANNOUNCEMENT_BODY_MAX, ANNOUNCEMENT_TITLE_MAX } from '@/lib/announcements/form'
import { reportClientError } from '@/lib/client-error-reporting'
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
} from '@/lib/announcements/presentation'

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
}

// ─── Helpers ─────────────────────────────────────────────────

const BANNER_MAX_FILE_SIZE = 5 * 1024 * 1024

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
}: AnnouncementFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Form state
  const [title, setTitle] = useState(initialData.title)
  const [body, setBody] = useState(initialData.body)
  const [categoryId, setCategoryId] = useState(initialData.category_id ?? '')
  const [bannerUrl, setBannerUrl] = useState(initialData.banner_url ?? '')
  const [registrationLink, setRegistrationLink] = useState(initialData.registration_link ?? '')
  const [expiresAt, setExpiresAt] = useState(toDateInputValue(initialData.expires_at))
  const [scheduledPublishAt, setScheduledPublishAt] = useState(
    toDateTimeLocalInputValue(initialData.scheduled_publish_at)
  )
  const [pinnedUntil, setPinnedUntil] = useState(
    toDateTimeLocalInputValue(initialData.pinned_until)
  )
  const [status, setStatus] = useState<PostStatus>(initialData.status)
  const [urgency, setUrgency] = useState<AnnouncementUrgency>(initialData.urgency)
  const [displayFont, setDisplayFont] = useState<AnnouncementDisplayFont>(initialData.display_font)
  const [displaySize, setDisplaySize] = useState<AnnouncementDisplaySize>(initialData.display_size)

  // UI state
  const [saveState, setSaveState] = useState<AutosaveStatus>('idle')
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [urlError, setUrlError] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [bannerSizeError, setBannerSizeError] = useState(false)
  const [bannerUploadError, setBannerUploadError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [formError, setFormError] = useState('')

  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const lastSaveRef = useRef<number>(Date.now())
  const dirtyRef = useRef(false)

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

  useEffect(() => {
    if (formError) setFormError('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, body, scheduledPublishAt, pinnedUntil, registrationLink])

  // Auto-grow textarea
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.style.height = 'auto'
      bodyRef.current.style.height = bodyRef.current.scrollHeight + 'px'
    }
  }, [body])

  // Autosave every 30 seconds if dirty
  useEffect(() => {
    if (isNew) return // Don't autosave new (unsaved) announcements

    const interval = setInterval(() => {
      if (dirtyRef.current && Date.now() - lastSaveRef.current > 30000) {
        handleSave()
      }
    }, 5000)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // ─── Handlers ────────────────────────────────────────────────

  async function handleSave() {
    setFormError('')
    const hasTimingError =
      Boolean(futureDateTimeError(scheduledPublishAt, 'Publish time')) ||
      Boolean(futureDateTimeError(pinnedUntil, 'Pin end time'))
    if (hasTimingError) {
      setFormError(
        futureDateTimeError(scheduledPublishAt, 'Publish time') ||
          futureDateTimeError(pinnedUntil, 'Pin end time')
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
      Boolean(futureDateTimeError(pinnedUntil, 'Pin end time'))
    if (hasTimingError) {
      setFormError(
        futureDateTimeError(scheduledPublishAt, 'Publish time') ||
          futureDateTimeError(pinnedUntil, 'Pin end time')
      )
      setSaveState('error')
      return
    }

    setIsPublishing(true)
    setSaveState('saving')
    try {
      const fd = buildFormData()
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
    } catch (error) {
      unstable_rethrow(error)
      reportClientError('announcement_form.unpublish', error)
      setFormError(error instanceof Error ? error.message : 'Could not update announcement.')
      setSaveState('error')
    } finally {
      setIsPublishing(false)
    }
  }

  async function handleDelete() {
    if (!onDelete) return
    startTransition(async () => {
      try {
        await onDelete()
      } catch (error) {
        unstable_rethrow(error)
        reportClientError('announcement_form.delete', error)
        setFormError(error instanceof Error ? error.message : 'Could not delete announcement.')
        setSaveState('error')
        setShowDeleteConfirm(false)
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
    if (file.size > BANNER_MAX_FILE_SIZE) {
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
  }

  const selectedCategory = categories.find((c) => c.id === categoryId)
  const selectedUrgency = URGENCY_META[urgency]
  const titleFontClass = getAnnouncementTitleFontClass(displayFont)
  const isScheduled = isFutureDateTime(scheduledPublishAt)
  const isPinned = isFutureDateTime(pinnedUntil)
  const scheduledPublishError = futureDateTimeError(scheduledPublishAt, 'Publish time')
  const pinnedUntilError = futureDateTimeError(pinnedUntil, 'Pin end time')

  // ─── Render ──────────────────────────────────────────────────

  const isPublished = status === 'published'
  const displayStatus = (status === 'expired' ? 'archived' : status) as
    | 'draft'
    | 'submitted'
    | 'published'
    | 'rejected'
    | 'archived'

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top bar with back button + delete */}
      <div className="mx-auto flex w-full max-w-[720px] items-center justify-between px-6 py-4">
        <button
          type="button"
          onClick={() => router.push('/dashboard/announcements')}
          className="flex min-h-11 items-center gap-2 rounded-lg text-sm text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
        >
          <ArrowLeft size={16} />
          Back to announcements
        </button>

        {onDelete && !isNew && (
          <div className="relative">
            {showDeleteConfirm ? (
              <div
                role="alertdialog"
                aria-modal="false"
                aria-labelledby="delete-announcement-title"
                aria-describedby="delete-announcement-description"
                className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--color-destructive)]/30 bg-[var(--color-surface)] p-2 shadow-[var(--shadow-soft)]"
              >
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
                  onClick={handleDelete}
                  disabled={isPending}
                  className="min-h-11 rounded-lg bg-[var(--color-destructive)] px-3 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {isPending ? 'Deleting…' : 'Confirm'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="min-h-11 rounded-lg border border-[var(--color-glass-border)] px-3 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-elevated)]"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex min-h-11 items-center gap-1.5 rounded-lg text-xs text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-destructive)]"
              >
                <Trash2 size={14} />
                Delete
              </button>
            )}
          </div>
        )}
      </div>

      {/* Form content */}
      <div className="mx-auto w-full max-w-[720px] flex-1 space-y-8 px-6 pb-24">
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
            onChange={(e) => setTitle(e.target.value.slice(0, ANNOUNCEMENT_TITLE_MAX))}
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
            onChange={(e) => setBody(e.target.value.slice(0, ANNOUNCEMENT_BODY_MAX))}
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
                className="pointer-events-none absolute top-1/2 left-4 z-10 h-2.5 w-2.5 -translate-y-1/2 rounded-full"
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
        <div>
          <div className="mb-2 flex items-center gap-2">
            <AlertTriangle
              size={14}
              className="text-[var(--color-text-muted)]"
              aria-hidden="true"
            />
            <label className="text-xs font-medium tracking-widest text-[var(--color-text-muted)] uppercase">
              Urgency
            </label>
          </div>
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
        </div>

        {/* Typography */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Type size={14} className="text-[var(--color-text-muted)]" aria-hidden="true" />
              <label className="text-xs font-medium tracking-widest text-[var(--color-text-muted)] uppercase">
                Font
              </label>
            </div>
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
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium tracking-widest text-[var(--color-text-muted)] uppercase">
              Text Size
            </label>
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
                      'min-h-11 rounded-xl border px-2 text-sm font-semibold transition-all duration-200',
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
          </div>
        </div>

        {/* Banner Image Upload */}
        <div>
          <label className="mb-2 block text-xs font-medium tracking-widest text-[var(--color-text-muted)] uppercase">
            Banner Image
          </label>

          {bannerUrl ? (
            <div className="relative overflow-hidden rounded-xl border border-[var(--color-glass-border)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={bannerUrl} alt="Banner preview" className="h-48 w-full object-contain" />
              <button
                type="button"
                onClick={removeBanner}
                className="absolute top-3 right-3 flex min-h-11 items-center gap-1.5 rounded-lg bg-black/50 px-3 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/70"
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
                  JPG, PNG, or WebP — max 5MB
                </p>
                {bannerSizeError && (
                  <p className="mt-1 text-xs font-semibold text-[var(--color-destructive)]">
                    File exceeds 5 MB limit. Choose a smaller image.
                  </p>
                )}
                {bannerUploadError && (
                  <p className="mt-1 text-xs font-semibold text-[var(--color-destructive)]">
                    {bannerUploadError}
                  </p>
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
              }}
              onBlur={handleUrlBlur}
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
          {urlError && <p className="mt-1.5 text-xs text-[var(--color-destructive)]">{urlError}</p>}
        </div>

        {/* Publishing Controls */}
        <div className="grid gap-4 sm:grid-cols-2">
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
                onChange={(e) => setScheduledPublishAt(e.target.value)}
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
                onChange={(e) => setPinnedUntil(e.target.value)}
                aria-invalid={Boolean(pinnedUntilError)}
                aria-describedby={
                  pinnedUntilError ? 'pinned-until-error pinned-until-help' : 'pinned-until-help'
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
              <p id="pinned-until-error" className="mt-1.5 text-xs text-[var(--color-destructive)]">
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
              className={cn(
                'w-full rounded-xl py-3 pr-4 pl-9 text-sm',
                'bg-transparent text-[var(--color-text-primary)]',
                'border border-[var(--color-glass-border)]',
                'focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:outline-none',
                'transition-all duration-200'
              )}
            />
          </div>
        </div>

        {/* Live Preview */}
        <div>
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
                    style={{ color: selectedUrgency.tone, background: selectedUrgency.background }}
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
                    className="h-2 w-2 rounded-full"
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
                {body || 'Announcement body will appear here…'}
              </p>
              {registrationLink && !urlError && (
                <span className="inline-block text-[15px] font-medium tracking-wider text-[var(--color-accent)] uppercase">
                  Register Here →
                </span>
              )}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Sticky ActionBar */}
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
      />
    </div>
  )
}
