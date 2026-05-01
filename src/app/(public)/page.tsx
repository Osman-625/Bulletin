import { Suspense } from 'react'
import { getPublicAnnouncements, getActiveCategories } from '@/lib/data'
import AnnouncementCard from '@/components/announcements/AnnouncementCard'
import CategoryFilter from '@/components/announcements/CategoryFilter'

export const metadata = { title: 'Announcements' }

export default async function PublicFeedPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams

  const [announcements, categories] = await Promise.all([
    getPublicAnnouncements(category),
    getActiveCategories(),
  ])

  const today = new Date().toLocaleDateString('en-MY', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const [featured, ...rest] = announcements
  const withRegistration = announcements.filter((a) => a.registration_link).length

  return (
    <div style={{ minHeight: '100dvh' }}>
      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">

        {/* ── Hero ─────────────────────────────────────── */}
        <div className="animate-fade-up mb-10">
          <div className="mb-3 flex items-center gap-3">
            <div
              className="h-6 w-1.5 rounded-full"
              style={{ background: 'var(--color-accent-inti)' }}
            />
            <span
              className="text-[11px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: 'var(--color-accent-inti)' }}
            >
              INTI International University
            </span>
          </div>

          <div className="flex items-end justify-between gap-4 mb-3">
            <h1
              className="font-display font-bold leading-[0.9] tracking-tighter"
              style={{
                fontSize: 'clamp(3.4rem, 9vw, 5.6rem)',
                color: 'var(--color-text-primary)',
              }}
            >
              Campus<br />Bulletin
            </h1>
            <span
              className="hidden sm:block pb-1 text-[11px] tracking-wide whitespace-nowrap"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {today}
            </span>
          </div>

          <p
            className="max-w-[440px] text-[15px] leading-relaxed"
            style={{ color: 'var(--color-text-muted)' }}
          >
          </p>
        </div>

        {/* ── Stats bar ────────────────────────────────── */}
        {announcements.length > 0 && (
          <div
            className="animate-fade-up delay-1 mb-8 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border px-5 py-3"
            style={{
              background: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
            }}
          >
            <StatPill value={announcements.length} label="Active" />
            <Divider />
            <StatPill value={categories.length} label="Categories" />
            {withRegistration > 0 && (
              <>
                <Divider />
                <StatPill
                  value={withRegistration}
                  label="Require Registration"
                  accent
                />
              </>
            )}
          </div>
        )}

        {/* ── Category filter ───────────────────────────── */}
        <div className="animate-fade-up delay-2 mb-8">
          <Suspense fallback={<FilterSkeleton />}>
            <CategoryFilter categories={categories} />
          </Suspense>
        </div>

        {/* ── Feed ─────────────────────────────────────── */}
        {announcements.length === 0 ? (
          <EmptyState category={category} />
        ) : (
          <div className="animate-fade-up delay-3 flex flex-col gap-4">
            {/* First announcement — full-width featured */}
            <AnnouncementCard announcement={featured} featured />

            {/* Remaining — 2-column grid (NOT 3 equal cols) */}
            {rest.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                {rest.map((a, i) => (
                  <div
                    key={a.id}
                    className="animate-fade-up"
                    style={{ animationDelay: `${0.36 + i * 0.06}s` }}
                  >
                    <AnnouncementCard announcement={a} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatPill({
  value,
  label,
  accent = false,
}: {
  value: number
  label: string
  accent?: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="font-display text-[20px] font-bold"
        style={{ color: accent ? 'var(--color-accent-inti)' : 'var(--color-text-primary)' }}
      >
        {value}
      </span>
      <span className="text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </span>
    </div>
  )
}

function Divider() {
  return (
    <div
      className="hidden h-4 w-px sm:block"
      style={{ background: 'var(--color-border)' }}
    />
  )
}

function FilterSkeleton() {
  return (
    <div className="flex gap-2">
      {[40, 72, 64, 80, 56].map((w, i) => (
        <div
          key={i}
          className="skeleton-shimmer h-[30px] rounded-full"
          style={{ width: w }}
        />
      ))}
    </div>
  )
}

function EmptyState({ category }: { category?: string }) {
  return (
    <div className="animate-fade-up flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
      <div className="h-px w-16" style={{ background: 'var(--color-border)' }} />
      <p className="font-display text-2xl italic" style={{ color: 'var(--color-text-muted)' }}>
        No announcements
      </p>
      <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
        {category ? 'Try a different category.' : 'Check back soon.'}
      </p>
    </div>
  )
}
