'use client'

import { useState, useEffect, useRef, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, Link2, Calendar, Trash2, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ActionBar } from './ActionBar'
import { GlassCard } from './GlassCard'
import type { AutosaveStatus } from './AutosaveIndicator'
import type { PostStatus } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

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
  published_at: string | null
}

interface AnnouncementFormProps {
  initialData: AnnouncementFormData
  categories: CategoryOption[]
  onSave: (formData: FormData) => Promise<{ success: boolean } | void>
  onPublish: () => Promise<{ success: boolean } | void>
  onSaveAndPublish?: (formData: FormData) => Promise<{ success: boolean } | void>
  onUnpublish?: () => Promise<{ success: boolean } | void>
  onDelete?: () => Promise<void>
  isNew?: boolean
}

// ─── Helpers ─────────────────────────────────────────────────

const TITLE_MAX = 120

function isValidUrl(str: string): boolean {
  try {
    new URL(str)
    return true
  } catch {
    return false
  }
}

// ─── Component ───────────────────────────────────────────────

export function AnnouncementForm({
  initialData,
  categories,
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
  const [expiresAt, setExpiresAt] = useState(initialData.expires_at?.slice(0, 10) ?? '')
  const [status, setStatus] = useState<PostStatus>(initialData.status)

  // UI state
  const [saveState, setSaveState] = useState<AutosaveStatus>('idle')
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [urlError, setUrlError] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const lastSaveRef = useRef<number>(Date.now())
  const dirtyRef = useRef(false)

  // Track dirty state
  useEffect(() => {
    dirtyRef.current = true
  }, [title, body, categoryId, bannerUrl, registrationLink, expiresAt])

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
    return fd
  }, [title, body, categoryId, bannerUrl, registrationLink, expiresAt])

  // ─── Handlers ────────────────────────────────────────────────

  async function handleSave() {
    setIsSaving(true)
    setSaveState('saving')
    try {
      const fd = buildFormData()
      await onSave(fd)
      setSaveState('saved')
      dirtyRef.current = false
      lastSaveRef.current = Date.now()
    } catch {
      setSaveState('error')
    } finally {
      setIsSaving(false)
    }
  }

  async function handlePublish() {
    setIsPublishing(true)
    setSaveState('saving')
    try {
      const fd = buildFormData()
      if (isNew && onSaveAndPublish) {
        await onSaveAndPublish(fd)
      } else {
        await onSave(fd)
        await onPublish()
        setStatus('published')
        setSaveState('saved')
        dirtyRef.current = false
      }
    } catch {
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
    } catch {
      setSaveState('error')
    } finally {
      setIsPublishing(false)
    }
  }

  async function handleDelete() {
    if (!onDelete) return
    startTransition(async () => {
      await onDelete()
    })
  }

  function handleUrlBlur() {
    if (registrationLink && !isValidUrl(registrationLink)) {
      setUrlError('Please enter a valid URL (e.g. https://forms.google.com/...)')
    } else {
      setUrlError('')
    }
  }

  // ─── Banner upload ───────────────────────────────────────────

  async function uploadBanner(file: File) {
    setIsUploading(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${crypto.randomUUID()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('announcement-banners')
        .upload(path, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('announcement-banners')
        .getPublicUrl(path)

      setBannerUrl(publicUrl)
    } catch (err) {
      console.error('Banner upload failed:', err)
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

  // ─── Category select state ──────────────────────────────────

  const [catOpen, setCatOpen] = useState(false)
  const catRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (catRef.current && !catRef.current.contains(e.target as Node)) {
        setCatOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedCategory = categories.find((c) => c.id === categoryId)

  // ─── Render ──────────────────────────────────────────────────

  const isPublished = status === 'published'
  const displayStatus = (status === 'expired' ? 'archived' : status) as 'draft' | 'published' | 'archived'

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar with back button + delete */}
      <div className="flex items-center justify-between px-6 py-4 max-w-[720px] w-full mx-auto">
        <button
          type="button"
          onClick={() => router.push('/dashboard/announcements')}
          className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <ArrowLeft size={16} />
          Back to announcements
        </button>

        {onDelete && !isNew && (
          <div className="relative">
            {showDeleteConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--color-destructive)]">Delete this?</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isPending}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--color-destructive)] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isPending ? 'Deleting…' : 'Confirm'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--color-glass-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-destructive)] transition-colors"
              >
                <Trash2 size={14} />
                Delete
              </button>
            )}
          </div>
        )}
      </div>

      {/* Form content */}
      <div className="flex-1 max-w-[720px] w-full mx-auto px-6 pb-24 space-y-8">
        {/* Title */}
        <div>
          <div className="flex items-end justify-between mb-1">
            <label
              htmlFor="announcement-title"
              className="text-xs uppercase tracking-widest text-[var(--color-text-muted)] font-medium"
            >
              Title
            </label>
            <span className="text-[10px] font-mono text-[var(--color-text-muted)]">
              {title.length}/{TITLE_MAX}
            </span>
          </div>
          <input
            id="announcement-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, TITLE_MAX))}
            placeholder="Announcement title"
            className={cn(
              'w-full text-xl font-semibold py-3',
              'bg-transparent text-[var(--color-text-primary)]',
              'placeholder:text-[var(--color-text-muted)]',
              'border-0 border-b border-[var(--color-glass-border)]',
              'focus:outline-none focus:border-[var(--color-accent)]',
              'transition-colors duration-200'
            )}
          />
        </div>

        {/* Body */}
        <div>
          <label
            htmlFor="announcement-body"
            className="text-xs uppercase tracking-widest text-[var(--color-text-muted)] font-medium mb-1 block"
          >
            Body
          </label>
          <textarea
            id="announcement-body"
            ref={bodyRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write the announcement body…"
            rows={6}
            className={cn(
              'w-full text-base leading-relaxed py-3 resize-none',
              'bg-transparent text-[var(--color-text-primary)]',
              'placeholder:text-[var(--color-text-muted)]',
              'border-0 border-b border-[var(--color-glass-border)]',
              'focus:outline-none focus:border-[var(--color-accent)]',
              'transition-colors duration-200'
            )}
          />
        </div>

        {/* Category */}
        <div>
          <label className="text-xs uppercase tracking-widest text-[var(--color-text-muted)] font-medium mb-2 block">
            Category
          </label>
          <div ref={catRef} className="relative">
            <button
              type="button"
              onClick={() => setCatOpen(!catOpen)}
              className={cn(
                'w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-left',
                'border border-[var(--color-glass-border)]',
                'bg-[var(--color-glass-bg)] backdrop-blur-sm',
                'hover:border-[var(--color-accent)]/40',
                'focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30',
                'transition-all duration-200'
              )}
            >
              {selectedCategory ? (
                <>
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: selectedCategory.color ?? 'var(--color-accent)' }}
                  />
                  <span className="text-[var(--color-text-primary)]">{selectedCategory.name}</span>
                </>
              ) : (
                <span className="text-[var(--color-text-muted)]">Select a category…</span>
              )}
            </button>

            {catOpen && (
              <div
                className={cn(
                  'absolute top-full left-0 right-0 mt-1 z-30',
                  'rounded-xl border border-[var(--color-glass-border)]',
                  'bg-[var(--color-surface)] shadow-lg',
                  'overflow-hidden',
                  'animate-in fade-in slide-in-from-top-1 duration-150'
                )}
              >
                {/* "None" option */}
                <button
                  type="button"
                  onClick={() => { setCategoryId(''); setCatOpen(false) }}
                  className={cn(
                    'w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left',
                    'hover:bg-[var(--color-surface-elevated)] transition-colors',
                    !categoryId && 'bg-[var(--color-accent-surface)]'
                  )}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-text-muted)]/30 shrink-0" />
                  <span className="text-[var(--color-text-secondary)]">None</span>
                </button>
                {categories.map((cat, i) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => { setCategoryId(cat.id); setCatOpen(false) }}
                    className={cn(
                      'w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left',
                      'hover:bg-[var(--color-surface-elevated)] transition-colors',
                      categoryId === cat.id && 'bg-[var(--color-accent-surface)]'
                    )}
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color ?? 'var(--color-accent)' }}
                    />
                    <span className="text-[var(--color-text-primary)]">{cat.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Banner Image Upload */}
        <div>
          <label className="text-xs uppercase tracking-widest text-[var(--color-text-muted)] font-medium mb-2 block">
            Banner Image
          </label>

          {bannerUrl ? (
            <div className="relative rounded-xl overflow-hidden border border-[var(--color-glass-border)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={bannerUrl}
                alt="Banner preview"
                className="w-full h-48 object-cover"
              />
              <button
                type="button"
                onClick={removeBanner}
                className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/50 backdrop-blur-sm text-white text-xs font-medium hover:bg-black/70 transition-colors"
              >
                <X size={12} />
                Remove
              </button>
            </div>
          ) : (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={() => setIsDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'flex flex-col items-center justify-center gap-3 py-12 rounded-xl cursor-pointer',
                'border-2 border-dashed transition-all duration-200',
                isDragOver
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent-surface)]'
                  : 'border-[var(--color-glass-border)] hover:border-[var(--color-accent)]/40 hover:bg-[var(--color-surface-elevated)]'
              )}
            >
              <Upload size={24} className={cn('text-[var(--color-text-muted)]', isDragOver && 'text-[var(--color-accent)]')} />
              <div className="text-center">
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {isUploading ? 'Uploading…' : 'Drop an image here or click to upload'}
                </p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                  JPG, PNG, or WebP — max 5MB
                </p>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Registration Link */}
        <div>
          <label
            htmlFor="registration-link"
            className="text-xs uppercase tracking-widest text-[var(--color-text-muted)] font-medium mb-1 block"
          >
            Registration Link <span className="normal-case tracking-normal">(optional)</span>
          </label>
          <div className="relative">
            <Link2
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none"
            />
            <input
              id="registration-link"
              type="url"
              value={registrationLink}
              onChange={(e) => { setRegistrationLink(e.target.value); setUrlError('') }}
              onBlur={handleUrlBlur}
              placeholder="https://forms.google.com/..."
              className={cn(
                'w-full pl-9 pr-4 py-3 text-sm rounded-xl',
                'bg-transparent text-[var(--color-text-primary)]',
                'placeholder:text-[var(--color-text-muted)]',
                'border transition-all duration-200',
                urlError
                  ? 'border-[var(--color-destructive)] focus:ring-[var(--color-destructive)]/30'
                  : 'border-[var(--color-glass-border)] focus:border-[var(--color-accent)]',
                'focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30'
              )}
            />
          </div>
          {urlError && (
            <p className="text-xs text-[var(--color-destructive)] mt-1.5">{urlError}</p>
          )}
        </div>

        {/* Expires At */}
        <div>
          <label
            htmlFor="expires-at"
            className="text-xs uppercase tracking-widest text-[var(--color-text-muted)] font-medium mb-1 block"
          >
            Expiry Date <span className="normal-case tracking-normal">(optional)</span>
          </label>
          <div className="relative">
            <Calendar
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none"
            />
            <input
              id="expires-at"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className={cn(
                'w-full pl-9 pr-4 py-3 text-sm rounded-xl',
                'bg-transparent text-[var(--color-text-primary)]',
                'border border-[var(--color-glass-border)]',
                'focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)]',
                'transition-all duration-200'
              )}
            />
          </div>
        </div>

        {/* Live Preview */}
        <div>
          <p className="text-xs uppercase tracking-widest text-[var(--color-text-muted)] font-medium mb-3">
            Preview
          </p>
          <GlassCard hover={false} className="overflow-hidden">
            {bannerUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={bannerUrl} alt="Preview banner" className="w-full h-36 object-cover" />
            )}
            <div className="p-5 space-y-2">
              {selectedCategory && (
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: selectedCategory.color ?? 'var(--color-accent)' }}
                  />
                  <span className="text-[9px] uppercase tracking-[0.2em] text-[var(--color-text-muted)] font-medium">
                    {selectedCategory.name}
                  </span>
                </div>
              )}
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] leading-tight">
                {title || 'Untitled Announcement'}
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] line-clamp-3 leading-relaxed">
                {body || 'Announcement body will appear here…'}
              </p>
              {registrationLink && !urlError && (
                <span className="inline-block text-[10px] font-medium uppercase tracking-wider text-[var(--color-accent)]">
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
      />
    </div>
  )
}
