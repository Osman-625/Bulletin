'use client'

import { useRef, useState } from 'react'
import NextImage from 'next/image'
import { Upload, X } from 'lucide-react'
import { cn } from '@/shared/utils'
import { createClient } from '@/infrastructure/database/client'
import { BANNER_MAX_FILE_SIZE_BYTES, BANNER_MAX_FILE_SIZE_MB } from '@/modules/announcements/form'
import { reportClientError } from '@/shared/errors/client-error-reporting'
import { captureProductEvent } from '@/shared/constants/product-analytics'

export function BannerImageField({
  bannerUrl,
  organizationId,
  onChange,
  onRemove,
}: {
  bannerUrl: string
  organizationId?: string | null
  onChange: (url: string) => void
  onRemove: () => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [bannerSizeError, setBannerSizeError] = useState(false)
  const [bannerUploadError, setBannerUploadError] = useState('')

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

      onChange(publicUrl)
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

  return (
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
            onClick={onRemove}
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
                  <p>File exceeds {BANNER_MAX_FILE_SIZE_MB} MB limit. Choose a smaller image.</p>
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
  )
}
