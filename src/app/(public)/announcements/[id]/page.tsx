import { notFound } from 'next/navigation'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import type { CSSProperties } from 'react'
import { getAnnouncementById } from '@/lib/data'
import { cn } from '@/lib/utils'
import {
  DETAIL_BODY_SIZES,
  DETAIL_TITLE_SIZES,
  URGENCY_META,
  getAnnouncementTitleFontClass,
  normalizeAnnouncementDisplayFont,
  normalizeAnnouncementDisplaySize,
  normalizeAnnouncementUrgency,
} from '@/lib/announcements/presentation'
import type { Metadata } from 'next'
import BackButton from '@/components/announcements/BackButton'
import { ViewTracker } from './ViewTracker'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const a = await getAnnouncementById(id)
  if (!a) return {}
  return { title: a.title }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-MY', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function categoryBadgeStyle(color: string): CSSProperties {
  return {
    color: 'var(--color-text-primary)',
    background: `color-mix(in oklab, ${color} 16%, var(--color-surface))`,
    borderColor: `color-mix(in oklab, ${color} 38%, var(--color-border))`,
  }
}

export default async function AnnouncementPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const announcement = await getAnnouncementById(id)
  if (!announcement) notFound()

  const { title, body, banner_url, published_at, expires_at, registration_link, categories, organizations } =
    announcement

  const catColor = categories?.color ?? '#C8102E'
  const urgency = normalizeAnnouncementUrgency(announcement.urgency)
  const displayFont = normalizeAnnouncementDisplayFont(announcement.display_font)
  const displaySize = normalizeAnnouncementDisplaySize(announcement.display_size)
  const urgencyMeta = URGENCY_META[urgency]
  const titleFontClass = getAnnouncementTitleFontClass(displayFont)

  return (
    <div className="min-h-[100dvh]">
      <ViewTracker announcementId={announcement.id} />
      <main className="mx-auto w-full max-w-[90rem] px-4 py-10 sm:px-6 lg:px-10 xl:px-12">
        <article className="animate-fade-up max-w-[58rem]">
          <BackButton />

          {banner_url && (
            <div
              className="relative mb-10 aspect-[16/7] w-full overflow-hidden rounded-2xl"
              style={{ background: 'var(--color-surface-elevated)' }}
            >
              <Image
                src={banner_url}
                alt={title}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 58rem"
                priority
              />
            </div>
          )}

          <div className="mb-5 flex flex-wrap items-center gap-3">
            {urgency !== 'normal' && (
              <span
                className="rounded-full px-3 py-1 text-xs font-semibold tracking-[0.06em]"
                style={{ color: urgencyMeta.tone, background: urgencyMeta.background }}
              >
                {urgencyMeta.label}
              </span>
            )}
            {categories && (
              <span
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.06em]"
                style={categoryBadgeStyle(catColor)}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: catColor }} aria-hidden="true" />
                {categories.name}
              </span>
            )}
            {organizations?.name && (
              <span className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
                {organizations.name}
              </span>
            )}
            {published_at && (
              <span className="text-sm text-[var(--color-text-muted)]">
                {formatDate(published_at)}
              </span>
            )}
          </div>

          <h1
            className={cn(titleFontClass, 'font-bold leading-[1.08] tracking-tight')}
            style={{
              fontSize: DETAIL_TITLE_SIZES[displaySize],
              color: 'var(--color-text-primary)',
            }}
          >
            {title}
          </h1>

          <div className="mt-5 mb-0.5 h-[3px] w-12 rounded-full" style={{ background: catColor }} />
          <div className="mb-8 h-px" style={{ background: 'var(--color-border)' }} />

          <div
            className="prose-bulletin leading-[1.85]"
            style={{
              color: 'var(--color-text-secondary)',
              maxWidth: '65ch',
              fontSize: DETAIL_BODY_SIZES[displaySize],
            }}
          >
            <ReactMarkdown
              components={{
                h2: ({ children }) => (
                  <h2
                    className={cn(titleFontClass, 'mt-6 mb-2 font-semibold')}
                    style={{ fontSize: '2rem', color: 'var(--color-text-primary)' }}
                  >
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3
                    className={cn(titleFontClass, 'mt-5 mb-1.5 font-semibold')}
                    style={{ fontSize: '1.5rem', color: 'var(--color-text-primary)' }}
                  >
                    {children}
                  </h3>
                ),
                p: ({ children }) => <p className="mb-4">{children}</p>,
                ul: ({ children }) => <ul className="mb-4 list-disc space-y-1 pl-5">{children}</ul>,
                ol: ({ children }) => <ol className="mb-4 list-decimal space-y-1 pl-5">{children}</ol>,
                strong: ({ children }) => (
                  <strong className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {children}
                  </strong>
                ),
              }}
            >
              {body ?? ''}
            </ReactMarkdown>
          </div>

          {registration_link && (
            <div className="mt-10 border-t pt-8" style={{ borderColor: 'var(--color-border)' }}>
              <a
                href={registration_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex cursor-pointer items-center rounded-[10px] bg-[var(--color-accent-inti)] px-8 py-3.5 font-sans text-base font-semibold text-white transition-all duration-200 hover:scale-[1.01] hover:opacity-90 focus:outline-none focus-visible:ring-2"
                style={{ boxShadow: '0 2px 12px rgba(200, 16, 46, 0.3)' }}
              >
                Register Here
              </a>
            </div>
          )}

          {expires_at && (
            <div
              className="mt-6 rounded-xl border px-4 py-3"
              style={{
                background: 'var(--color-surface-elevated)',
                borderColor: 'var(--color-border)',
              }}
            >
              <p className="text-sm text-[var(--color-text-muted)]">
                This announcement expires on{' '}
                <span style={{ color: 'var(--color-text-secondary)' }}>
                  {formatDate(expires_at)}
                </span>
              </p>
            </div>
          )}
        </article>
      </main>
    </div>
  )
}
