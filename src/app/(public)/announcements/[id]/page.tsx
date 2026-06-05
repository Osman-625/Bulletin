import { notFound, permanentRedirect } from 'next/navigation'
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
import { announcementPath, announcementPathSegment, toSafeHttpUrl } from '@/lib/announcements/urls'
import { formatCampusLongDate } from '@/lib/announcements/public-board'
import { DEFAULT_CATEGORY_DISPLAY_COLOR } from '@/lib/categories/display'
import type { Metadata } from 'next'
import BackButton from '@/components/announcements/BackButton'
import { RegistrationLink } from '@/components/announcements/RegistrationLink'
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

function categoryBadgeStyle(color: string): CSSProperties {
  return {
    color: 'var(--color-text-primary)',
    background: `color-mix(in oklab, ${color} 16%, var(--color-surface))`,
    borderColor: `color-mix(in oklab, ${color} 38%, var(--color-border))`,
  }
}

function stripMarkdownPreview(markdown: string | null): string {
  if (!markdown) return ''

  return markdown
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/^\s*[-*]\s+/gm, '')
    .replace(/\r?\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function removeDuplicateTitleHeading(markdown: string | null, title: string): string {
  if (!markdown) return ''

  const lines = markdown.trimStart().split(/\r?\n/)
  const firstLine = lines[0]?.replace(/^#{1,6}\s+/, '').trim()

  if (firstLine?.toLowerCase() === title.trim().toLowerCase()) {
    return lines.slice(1).join('\n').trimStart()
  }

  return markdown
}

function DetailMetaTile({
  label,
  value,
  active = false,
}: {
  label: string
  value: string
  active?: boolean
}) {
  return (
    <div
      className="rounded-[12px] border px-4 py-3"
      style={{
        background: active ? 'var(--color-accent-surface)' : 'var(--color-surface-elevated)',
        borderColor: active
          ? 'color-mix(in oklab, var(--color-accent-inti) 34%, var(--color-border))'
          : 'var(--color-border-subtle)',
      }}
    >
      <p className="font-mono text-[0.65rem] font-bold tracking-[0.14em] text-[var(--color-text-muted)] uppercase">
        {label}
      </p>
      <p
        className="mt-1 text-sm font-bold"
        style={{ color: active ? 'var(--color-accent-inti)' : 'var(--color-text-primary)' }}
      >
        {value}
      </p>
    </div>
  )
}

export default async function AnnouncementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const announcement = await getAnnouncementById(id)
  if (!announcement) notFound()

  if (id !== announcementPathSegment(announcement)) {
    permanentRedirect(announcementPath(announcement))
  }

  const {
    title,
    body,
    banner_url,
    published_at,
    expires_at,
    registration_link,
    categories,
    organizations,
  } = announcement

  const catColor = categories?.color ?? DEFAULT_CATEGORY_DISPLAY_COLOR
  const urgency = normalizeAnnouncementUrgency(announcement.urgency)
  const displayFont = normalizeAnnouncementDisplayFont(announcement.display_font)
  const displaySize = normalizeAnnouncementDisplaySize(announcement.display_size)
  const urgencyMeta = URGENCY_META[urgency]
  const titleFontClass = getAnnouncementTitleFontClass(displayFont)
  const registrationHref = toSafeHttpUrl(registration_link)
  const detailBody = removeDuplicateTitleHeading(body, title)
  const preview = stripMarkdownPreview(detailBody)

  return (
    <div className="future-warm-plane min-h-[100dvh]">
      <ViewTracker
        announcementId={announcement.id}
        categorySlug={categories?.slug ?? null}
        organizationId={announcement.organization_id ?? null}
        hasRegistrationLink={Boolean(registrationHref)}
      />
      <main className="mx-auto w-full max-w-[1461px] px-3 py-10 sm:px-5 lg:px-8">
        <article className="animate-fade-up mx-auto max-w-[82rem]">
          <BackButton />

          <section className="future-bento-cell overflow-hidden rounded-[1.65rem]">
            <div
              className={cn(
                'grid',
                banner_url && 'lg:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.78fr)]'
              )}
            >
              <div className="p-5 sm:p-8 lg:p-10">
                <div className="mb-5 flex flex-wrap items-center gap-3">
                  {urgency !== 'normal' && (
                    <span
                      className="rounded-[var(--radius-tag)] px-3 py-1.5 text-xs font-bold tracking-[0.04em]"
                      style={{ color: urgencyMeta.tone, background: urgencyMeta.background }}
                    >
                      {urgencyMeta.label}
                    </span>
                  )}
                  {categories && (
                    <span
                      className="inline-flex items-center gap-1.5 rounded-[var(--radius-tag)] border px-3 py-1.5 text-xs font-bold tracking-[0.04em]"
                      style={categoryBadgeStyle(catColor)}
                    >
                      <span
                        className="size-1.5 rounded-full"
                        style={{ background: catColor }}
                        aria-hidden="true"
                      />
                      {categories.name}
                    </span>
                  )}
                  {organizations?.name && (
                    <span className="font-mono text-[0.66rem] font-bold tracking-[0.14em] text-[var(--color-text-muted)] uppercase">
                      {organizations.name}
                    </span>
                  )}
                </div>

                <h1
                  className={cn(titleFontClass, 'leading-[1.02] font-bold tracking-tight')}
                  style={{
                    fontSize: `min(${DETAIL_TITLE_SIZES[displaySize]}, 4.35rem)`,
                    color: 'var(--color-text-primary)',
                  }}
                >
                  {title}
                </h1>

                {preview && (
                  <p className="mt-5 max-w-[58ch] text-base leading-7 text-[var(--color-text-secondary)] sm:text-lg">
                    {preview.length > 210 ? `${preview.slice(0, 210).trim()}...` : preview}
                  </p>
                )}

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  <DetailMetaTile label="Issued" value={formatCampusLongDate(published_at)} />
                  <DetailMetaTile
                    label="Deadline"
                    value={formatCampusLongDate(expires_at, 'No deadline')}
                    active={Boolean(expires_at)}
                  />
                </div>
              </div>

              {banner_url && (
                <a
                  href={banner_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative block h-[18rem] border-t border-[var(--color-border-subtle)] bg-[color-mix(in_oklab,var(--color-gold)_10%,var(--color-surface-elevated))] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-inti)] sm:h-[24rem] lg:h-auto lg:min-h-[31rem] lg:border-t-0 lg:border-l"
                  aria-label="Open original announcement image"
                >
                  <Image
                    data-testid="announcement-poster-image"
                    src={banner_url}
                    alt={title}
                    fill
                    sizes="(max-width: 768px) 92vw, (max-width: 1280px) 38vw, 32rem"
                    className="object-contain p-5 transition-transform duration-500 ease-[var(--ease-ui)] group-hover:scale-[1.015] sm:p-7"
                    preload
                  />
                </a>
              )}
            </div>
          </section>

          <section className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="future-bento-cell rounded-[1.45rem] p-5 sm:p-8">
              <div className="mb-6 flex items-center gap-3">
                <div
                  className="h-[3px] w-12 rounded-full"
                  style={{ background: catColor }}
                  aria-hidden="true"
                />
                <p className="future-kicker">Full details</p>
              </div>
              <div
                className="prose-bulletin leading-[1.85]"
                style={{
                  color: 'var(--color-text-secondary)',
                  maxWidth: '70ch',
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
                    ul: ({ children }) => (
                      <ul className="mb-4 list-disc space-y-1 pl-5">{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="mb-4 list-decimal space-y-1 pl-5">{children}</ol>
                    ),
                    strong: ({ children }) => (
                      <strong
                        className="font-semibold"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {children}
                      </strong>
                    ),
                  }}
                >
                  {detailBody}
                </ReactMarkdown>
              </div>
            </div>

            <aside className="future-bento-cell h-fit rounded-[1.45rem] p-5">
              <p className="future-kicker">Next step</p>
              <div className="mt-5 space-y-3">
                <DetailMetaTile
                  label="Organization"
                  value={organizations?.name ?? 'Campus bulletin'}
                />
                {expires_at && (
                  <DetailMetaTile label="Expires" value={formatCampusLongDate(expires_at)} active />
                )}
              </div>
              {registrationHref && (
                <RegistrationLink
                  href={registrationHref}
                  announcementId={announcement.id}
                  className="action-lift mt-5 inline-flex min-h-12 w-full cursor-pointer items-center justify-center rounded-[10px] bg-[var(--color-accent-inti)] px-5 font-sans text-sm font-semibold text-[var(--color-on-accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-inti)] focus-visible:ring-offset-2"
                  style={{ boxShadow: 'var(--shadow-button)' }}
                >
                  Register
                </RegistrationLink>
              )}
            </aside>
          </section>
        </article>
      </main>
    </div>
  )
}
