'use client'

import NextImage from 'next/image'
import { Upload, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BannerUploaderProps {
  bannerUrl: string
  isUploading: boolean
  isDragOver: boolean
  bannerSizeError: boolean
  bannerUploadError: string
  maxSizeMb: number
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onDrop: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onClickUpload: () => void
  onRemove: () => void
}

export function BannerUploader({
  bannerUrl,
  isUploading,
  isDragOver,
  bannerSizeError,
  bannerUploadError,
  maxSizeMb,
  fileInputRef,
  onDrop,
  onDragOver,
  onDragLeave,
  onFileChange,
  onClickUpload,
  onRemove,
}: BannerUploaderProps) {
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
            className="absolute top-3 right-3 flex min-h-11 items-center gap-1.5 rounded-lg bg-black/50 px-3 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/70"
          >
            <X size={12} aria-hidden="true" />
            Remove
          </button>
        </div>
      ) : (
        <button
          type="button"
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={onClickUpload}
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
            aria-hidden="true"
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
              JPG, PNG, or WebP, max {maxSizeMb}MB
            </p>
            {bannerSizeError && (
              <p className="mt-1 text-xs font-semibold text-[var(--color-destructive)]">
                File exceeds {maxSizeMb} MB limit. Choose a smaller image.
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
        onChange={onFileChange}
        aria-label="Upload banner image"
        className="hidden"
      />
    </div>
  )
}
