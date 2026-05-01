import Link from 'next/link'
import Image from 'next/image'
import type { AnnouncementWithRelations } from '@/lib/types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-MY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function isExpiringSoon(expiresAt: string | null): boolean {
  if (!expiresAt) return false
  const diff = new Date(expiresAt).getTime() - Date.now()
  return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000
}

// ── Standard card ──────────────────────────────────────────────────────────────
export default function AnnouncementCard({
  announcement,
  featured = false,
}: {
  announcement: AnnouncementWithRelations
  featured?: boolean
}) {
  return featured ? (
    <FeaturedCard announcement={announcement} />
  ) : (
    <StandardCard announcement={announcement} />
  )
}

// ── Standard (2-col grid) ──────────────────────────────────────────────────────
function StandardCard({ announcement }: { announcement: AnnouncementWithRelations }) {
  const {
    id, title, body, banner_url, published_at, expires_at,
    registration_link, categories, organizations,
  } = announcement

  const catColor = categories?.color ?? '#C8102E'
  const expiring = isExpiringSoon(expires_at)

  return (
    <Link
      href={`/announcements/${id}`}
      className="card-lift group relative flex flex-col overflow-hidden rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        boxShadow: '0 2px 16px rgba(0, 0, 0, 0.07)',
      }}
    >
      {/* Category colour stripe */}
      <div
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-1 rounded-l-2xl"
        style={{ background: catColor }}
      />

      {/* Banner */}
      {banner_url && (
        <div
          className="relative h-40 overflow-hidden"
          style={{ background: 'var(--color-surface-elevated)' }}
        >
          <Image
            src={banner_url}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            sizes="(max-width: 640px) 100vw, 50vw"
          />
        </div>
      )}

      <div className="flex flex-1 flex-col gap-3 p-5 pl-6">
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-1.5">
          {categories && (
            <span
              className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-[0.05em]"
              style={{ color: catColor, background: catColor + '1A' }}
            >
              {categories.name}
            </span>
          )}
          {expiring && (
            <span
              className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
              style={{ color: 'var(--color-gold)', background: 'rgba(212,148,31,0.12)' }}
            >
              Exp: {formatDate(expires_at!)}
            </span>
          )}
        </div>

        {/* Title */}
        <h2
          className="font-display font-semibold leading-[1.3]"
          style={{ fontSize: 17, color: 'var(--color-text-primary)' }}
        >
          {title}
        </h2>

        {/* Excerpt */}
        <p
          className="flex-1 line-clamp-2 text-[13px] leading-relaxed"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {body}
        </p>

        {/* Footer */}
        <div
          className="flex items-center justify-between gap-2 border-t pt-3"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <span className="truncate text-[11.5px] font-medium" style={{ color: 'var(--color-text-muted)' }}>
            {organizations?.name}
          </span>
          {published_at && (
            <span className="flex-shrink-0 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
              {formatDate(published_at)}
            </span>
          )}
        </div>

        {registration_link && (
          <span
            className="text-[10px] font-semibold tracking-[0.1em] uppercase"
            style={{ color: 'var(--color-accent-inti)' }}
          >
            Register →
          </span>
        )}
      </div>
    </Link>
  )
}

// ── Featured (full-width horizontal) ──────────────────────────────────────────
function FeaturedCard({ announcement }: { announcement: AnnouncementWithRelations }) {
  const {
    id, title, body, banner_url, published_at, expires_at,
    registration_link, categories, organizations,
  } = announcement

  const catColor = categories?.color ?? '#C8102E'
  const expiring = isExpiringSoon(expires_at)

  return (
    <Link
      href={`/announcements/${id}`}
      className="card-lift group relative flex flex-col overflow-hidden rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-offset-2 lg:flex-row"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        boxShadow: '0 2px 20px rgba(0, 0, 0, 0.08)',
        minHeight: 220,
      }}
    >
      {/* Left accent stripe — slightly wider for featured */}
      <div
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-1.5 rounded-l-2xl"
        style={{ background: catColor }}
      />

      {/* Content — left side */}
      <div className="flex flex-1 flex-col justify-between p-7 pl-8">
        {/* Badges */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {categories && (
            <span
              className="rounded-full px-3 py-1 text-[10px] font-semibold tracking-[0.06em]"
              style={{ color: catColor, background: catColor + '1A' }}
            >
              {categories.name}
            </span>
          )}
          {expiring && (
            <span
              className="rounded-full px-3 py-1 text-[10px] font-semibold"
              style={{ color: 'var(--color-gold)', background: 'rgba(212,148,31,0.12)' }}
            >
              Exp: {formatDate(expires_at!)}
            </span>
          )}
        </div>

        {/* Title — larger for featured */}
        <h2
          className="font-display font-semibold leading-[1.25] mb-3"
          style={{ fontSize: 'clamp(1.25rem, 2.5vw, 1.55rem)', color: 'var(--color-text-primary)' }}
        >
          {title}
        </h2>

        {/* Excerpt — 3 lines */}
        <p
          className="line-clamp-3 flex-1 text-[14px] leading-relaxed mb-5"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {body}
        </p>

        {/* Footer */}
        <div>
          <div
            className="flex items-center justify-between gap-2 border-t pt-4"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <span className="truncate text-[12px] font-medium" style={{ color: 'var(--color-text-muted)' }}>
              {organizations?.name}
            </span>
            {published_at && (
              <span className="flex-shrink-0 text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
                {formatDate(published_at)}
              </span>
            )}
          </div>
          {registration_link && (
            <span
              className="mt-3 block text-[10px] font-semibold tracking-[0.1em] uppercase"
              style={{ color: 'var(--color-accent-inti)' }}
            >
              Register →
            </span>
          )}
        </div>
      </div>

      {/* Visual panel — right side */}
      <div
        className="relative min-h-[180px] overflow-hidden lg:w-[42%] lg:min-h-0"
        style={{ background: catColor + '14' }}
      >
        {banner_url ? (
          <Image
            src={banner_url}
            alt={title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            sizes="(max-width: 1024px) 100vw, 42vw"
            priority
          />
        ) : (
          // No banner: typographic placeholder using category initial
          <div className="flex h-full items-center justify-center">
            <span
              className="font-display font-bold select-none leading-none opacity-[0.18]"
              style={{ fontSize: 'clamp(5rem, 10vw, 9rem)', color: catColor }}
            >
              {categories?.name?.[0] ?? organizations?.name?.[0] ?? 'B'}
            </span>
          </div>
        )}
      </div>
    </Link>
  )
}
