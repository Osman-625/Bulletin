import { Suspense } from 'react'
import Link from 'next/link'
import { getPublicAnnouncements, getActiveCategories } from '@/lib/data'
import { derivePublicTopics } from '@/lib/announcements/feed'
import AnnouncementCard from '@/components/announcements/AnnouncementCard'
import type { AnnouncementCardVisual } from '@/components/announcements/AnnouncementCard'
import CategoryFilter from '@/components/announcements/CategoryFilter'
import { BrandMark } from '@/components/layout/BrandMark'
import {
  URGENCY_META,
  isAnnouncementPinned,
  normalizeAnnouncementUrgency,
} from '@/lib/announcements/presentation'
import type { AnnouncementWithRelations } from '@/lib/types'

export const metadata = { title: { absolute: 'Campus Bulletin' } }

const BOARD_SORTS = ['priority', 'issued', 'closing'] as const
const DAY_MS = 24 * 60 * 60 * 1000

type BoardSort = (typeof BOARD_SORTS)[number]
type BoardSectionId = 'daily' | 'closing' | 'future' | 'campus'

const BOARD_SORT_OPTIONS: Array<{
  sort: BoardSort
  label: string
  eyebrow: string
  summary: string
}> = [
  {
    sort: 'priority',
    label: 'Most urgent',
    eyebrow: 'Urgency',
    summary: 'Pinned, urgent, and deadline-sensitive notices first',
  },
  {
    sort: 'issued',
    label: 'Latest first',
    eyebrow: 'Newest',
    summary: 'Most recently published notices at the top',
  },
  {
    sort: 'closing',
    label: 'Closing soon',
    eyebrow: 'Deadline',
    summary: 'Nearest active deadlines at the top',
  },
]

const BOARD_SECTION_META: Record<
  BoardSectionId,
  {
    label: string
    summary: string
  }
> = {
  daily: {
    label: 'New today',
    summary: 'Fresh notices published today for quick campus scanning.',
  },
  closing: {
    label: 'Closing soon',
    summary: 'Deadlines and registrations that need attention first.',
  },
  future: {
    label: 'Plan ahead',
    summary: 'Upcoming opportunities with more time to plan.',
  },
  campus: {
    label: 'General notices',
    summary: 'General notices that remain useful but are not deadline-led.',
  },
}

export default async function PublicFeedPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string; sort?: string }>
}) {
  const { category, q, sort } = await searchParams
  const search = q?.trim() ?? ''
  const activeSort = normalizeBoardSort(sort)

  const [allAnnouncements, categories] = await Promise.all([
    getPublicAnnouncements(category, search),
    getActiveCategories(),
  ])
  const announcements = sortAnnouncementsForPublicBoard(allAnnouncements, activeSort)
  const topics = derivePublicTopics(categories, allAnnouncements)

  const today = new Date().toLocaleDateString('en-MY', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const pinnedHero = announcements.find((a) => isAnnouncementPinned(a))
  const featured = pinnedHero ?? announcements.find((a) => a.banner_url) ?? announcements[0]
  const featuredIsPinned = featured ? isAnnouncementPinned(featured) : false
  const rest = featured ? announcements.filter((a) => a.id !== featured.id) : announcements
  const boardSections = buildAnnouncementSections(rest, activeSort)
  const activeCategory = category ? topics.find((cat) => cat.slug === category)?.name : null
  const clearSearchHref = buildFeedHref({ category, sort: activeSort })
  const closingThisWeek = announcements.filter((a) => {
    const days = daysUntilDeadline(a.expires_at)
    return days !== null && days <= 7
  }).length

  return (
    <div className="future-warm-plane min-h-[100dvh]">
      {/* ── Masthead ──────────────────────────────────────── */}
      <section
        className="public-page-reveal border-b border-[var(--color-border)] px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14"
        aria-labelledby="public-feed-title"
      >
        <div className="mx-auto flex max-w-[1280px] flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          {/* Left: headline + tagline */}
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="future-kicker">INTI campus board</span>
              <span
                className="h-1.5 w-1.5 rounded-full bg-[var(--color-gold)]"
                aria-hidden="true"
              />
              <span className="font-mono text-[0.65rem] font-bold tracking-[0.14em] text-[var(--color-text-muted)] uppercase">
                Clubs · Careers · Student Life · Workshops
              </span>
            </div>
            <h1
              id="public-feed-title"
              className="font-display text-5xl leading-[0.9] font-extrabold tracking-[-0.02em] text-[var(--color-text-primary)] sm:text-6xl lg:text-[5.5rem]"
            >
              Campus
              <br />
              Bulletin
            </h1>
            <p className="mt-5 max-w-[36rem] text-base leading-7 text-[var(--color-text-muted)] sm:text-lg">
              Official notices, student club posts, deadlines, and campus events — all in one public
              board.
            </p>
          </div>

          {/* Right: live metrics */}
          <div className="hidden sm:flex sm:flex-col sm:items-end sm:gap-1">
            <p className="font-mono text-[0.65rem] font-bold tracking-[0.14em] text-[var(--color-text-muted)] uppercase">
              {today}
            </p>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="font-display text-6xl font-bold text-[var(--color-text-primary)] tabular-nums">
                {announcements.length}
              </span>
              <span className="text-base font-medium text-[var(--color-text-muted)]">
                active notices
              </span>
            </div>
            {closingThisWeek > 0 && (
              <p className="mt-1 font-mono text-sm font-bold text-[var(--color-accent-inti)]">
                {closingThisWeek} closing this week
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── Content: sidebar + main ───────────────────────── */}
      <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 sm:py-8 lg:flex lg:gap-10 lg:px-8 lg:py-10 xl:gap-14">
        {/* ── Sidebar (desktop only) ─────────────────────── */}
        <aside
          className="hidden lg:block lg:w-56 lg:flex-shrink-0 xl:w-64"
          aria-label="Filters and sort order"
        >
          <div className="sticky top-24 flex flex-col gap-8">
            {/* Search */}
            <div>
              <h2 className="future-kicker mb-3">Search</h2>
              <form action="/" className="flex flex-col gap-2">
                {category && <input type="hidden" name="category" value={category} />}
                {activeSort !== 'priority' && (
                  <input type="hidden" name="sort" value={activeSort} />
                )}
                <label htmlFor="sidebar-search" className="sr-only">
                  Search announcements
                </label>
                <input
                  id="sidebar-search"
                  name="q"
                  type="search"
                  defaultValue={search}
                  placeholder="Search notices..."
                  className="input-inti min-h-11 w-full rounded-[0.875rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 text-sm text-[var(--color-text-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.42)] outline-none placeholder:text-[var(--color-text-muted)]"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="action-lift min-h-9 flex-1 rounded-[0.875rem] bg-[var(--color-accent-inti)] px-4 text-sm font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-inti)]"
                  >
                    Search
                  </button>
                  {search && (
                    <Link
                      href={clearSearchHref}
                      className="inline-flex min-h-9 items-center rounded-[0.875rem] border border-[var(--color-border)] px-3 text-sm font-semibold text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]"
                    >
                      Clear
                    </Link>
                  )}
                </div>
              </form>
            </div>

            {/* Sort */}
            <nav aria-label="Sort order">
              <h2 className="future-kicker mb-3">Sort by</h2>
              <div className="flex flex-col gap-0.5">
                {BOARD_SORT_OPTIONS.map((option) => {
                  const active = option.sort === activeSort
                  return (
                    <Link
                      key={option.sort}
                      href={buildFeedHref({ category, q: search, sort: option.sort })}
                      className="flex items-center justify-between rounded-[0.75rem] px-3 py-2.5 text-sm font-semibold transition-colors duration-200"
                      style={{
                        background: active ? 'var(--color-text-primary)' : 'transparent',
                        color: active ? 'var(--color-canvas)' : 'var(--color-text-muted)',
                      }}
                      aria-current={active ? 'true' : undefined}
                    >
                      {option.label}
                      {active && (
                        <span className="font-mono text-[0.5rem] font-bold tracking-wider uppercase opacity-60">
                          Active
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </nav>

            {/* Categories */}
            <nav aria-label="Filter by topic">
              <h2 className="future-kicker mb-3">Topics</h2>
              <div className="flex flex-col gap-0.5">
                <Link
                  href={buildFeedHref({ sort: activeSort, q: search })}
                  className="flex items-center gap-2.5 rounded-[0.75rem] px-3 py-2 text-sm font-semibold transition-colors duration-200"
                  style={{
                    background: !category ? 'var(--color-surface-elevated)' : 'transparent',
                    color: !category ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                    borderLeft: !category
                      ? '3px solid var(--color-accent-inti)'
                      : '3px solid transparent',
                    paddingLeft: '0.625rem',
                  }}
                >
                  All topics
                </Link>
                {topics.map((cat) => {
                  const catColor = cat.color ?? '#C8102E'
                  const isActive = category === cat.slug
                  return (
                    <Link
                      key={cat.id}
                      href={buildFeedHref({ category: cat.slug, sort: activeSort, q: search })}
                      className="flex items-center gap-2.5 rounded-[0.75rem] py-2 text-sm font-semibold transition-colors duration-200"
                      style={{
                        background: isActive
                          ? `color-mix(in oklab, ${catColor} 10%, var(--color-surface))`
                          : 'transparent',
                        color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                        borderLeft: isActive ? `3px solid ${catColor}` : '3px solid transparent',
                        paddingLeft: '0.625rem',
                        paddingRight: '0.75rem',
                      }}
                      aria-current={isActive ? 'true' : undefined}
                    >
                      <span
                        className="h-2 w-2 flex-shrink-0 rounded-full"
                        style={{ background: catColor }}
                        aria-hidden="true"
                      />
                      {cat.name}
                    </Link>
                  )
                })}
              </div>
            </nav>

            {/* Live stats panel */}
            <div
              className="rounded-[1rem] border p-4"
              style={{
                borderColor: 'var(--color-border)',
                background: 'var(--color-surface)',
                boxShadow: 'var(--shadow-soft)',
              }}
            >
              <p className="future-kicker mb-3">Live board</p>
              <div>
                <p className="font-display text-4xl font-bold text-[var(--color-text-primary)] tabular-nums">
                  {announcements.length}
                </p>
                <p className="mt-1 text-xs font-medium text-[var(--color-text-muted)]">
                  active notices
                </p>
              </div>
              {closingThisWeek > 0 && (
                <div
                  className="mt-3 border-t pt-3"
                  style={{ borderColor: 'var(--color-border-subtle)' }}
                >
                  <p className="font-display text-4xl font-bold text-[var(--color-accent-inti)] tabular-nums">
                    {closingThisWeek}
                  </p>
                  <p className="mt-1 text-xs font-medium text-[var(--color-text-muted)]">
                    closing this week
                  </p>
                </div>
              )}
              <div
                className="mt-3 border-t pt-3"
                style={{ borderColor: 'var(--color-border-subtle)' }}
              >
                <p className="text-xs font-medium text-[var(--color-text-muted)]">
                  {topics.length} topics · updated live
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Main content ───────────────────────────────── */}
        <main id="announcements" className="min-w-0 flex-1">
          {/* Mobile controls (hidden on desktop) */}
          <section
            className="public-page-reveal mb-6 grid gap-2 delay-3 lg:hidden"
            aria-label="Search and filters"
          >
            <div className="future-bento-cell rounded-[1.05rem] p-2.5 shadow-[var(--shadow-soft)]">
              <form action="/" className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                {category && <input type="hidden" name="category" value={category} />}
                {activeSort !== 'priority' && (
                  <input type="hidden" name="sort" value={activeSort} />
                )}
                <label htmlFor="mobile-search" className="sr-only">
                  Search announcements
                </label>
                <input
                  id="mobile-search"
                  name="q"
                  type="search"
                  defaultValue={search}
                  placeholder="Search clubs, workshops, deadlines..."
                  className="input-inti min-h-12 rounded-[1rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-base text-[var(--color-text-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.42)] outline-none placeholder:text-[var(--color-text-muted)]"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="action-lift min-h-12 rounded-[1rem] bg-[var(--color-accent-inti)] px-5 text-base font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-inti)]"
                  >
                    Search
                  </button>
                  {search && (
                    <Link
                      href={clearSearchHref}
                      className="inline-flex min-h-12 items-center rounded-[1rem] border border-[var(--color-border)] px-4 text-base font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                    >
                      Clear
                    </Link>
                  )}
                </div>
              </form>
            </div>

            <div className="future-bento-cell rounded-[1.05rem] p-2.5 shadow-[var(--shadow-soft)]">
              <Suspense fallback={<FilterSkeleton />}>
                <CategoryFilter categories={topics} />
              </Suspense>
            </div>

            {/* Mobile sort row */}
            <div className="future-bento-cell flex gap-1.5 rounded-[1.05rem] p-2.5">
              {BOARD_SORT_OPTIONS.map((option) => {
                const active = option.sort === activeSort
                return (
                  <Link
                    key={option.sort}
                    href={buildFeedHref({ category, q: search, sort: option.sort })}
                    className="flex-1 rounded-[0.75rem] py-2 text-center text-sm font-semibold transition-colors"
                    style={{
                      background: active ? 'var(--color-text-primary)' : 'var(--color-surface)',
                      color: active ? 'var(--color-canvas)' : 'var(--color-text-muted)',
                      border: `1px solid ${active ? 'var(--color-text-primary)' : 'var(--color-border)'}`,
                    }}
                    aria-current={active ? 'true' : undefined}
                  >
                    {option.label}
                  </Link>
                )
              })}
            </div>
          </section>

          {/* Content heading */}
          <div className="public-page-reveal mb-6 flex flex-wrap items-baseline justify-between gap-3 delay-4">
            <div>
              <p className="future-kicker">Campus notices</p>
              <h2 className="font-display mt-1 text-2xl leading-none font-bold text-[var(--color-text-primary)] sm:text-3xl">
                {activeCategory ?? 'All announcements'}
              </h2>
            </div>
            <p className="text-sm font-semibold text-[var(--color-text-muted)]">
              {announcements.length} {announcements.length === 1 ? 'notice' : 'notices'}
            </p>
          </div>

          {announcements.length === 0 ? (
            <EmptyState category={activeCategory} search={search} />
          ) : (
            <div className="flex flex-col gap-10 md:gap-14">
              {/* Featured notice */}
              {featured && (
                <div className="public-page-reveal">
                  <p className="future-kicker mb-2">
                    {featuredIsPinned ? 'Pinned notice' : 'Featured notice'}
                  </p>
                  <article className="hero-poster-card" data-bento-tile="featured">
                    <AnnouncementCard
                      announcement={featured}
                      featured
                      visual={imageBentoVariant(featured, 0, true)}
                    />
                  </article>
                </div>
              )}

              {/* Board sections */}
              {boardSections.every((s) => s.items.length === 0) ? (
                <div className="future-bento-cell rounded-[1.25rem] px-6 py-10 text-base text-[var(--color-text-muted)]">
                  No more announcements match this view.
                </div>
              ) : (
                boardSections.map((section, sectionIndex) =>
                  section.items.length > 0 ? (
                    <section
                      key={section.id}
                      className="public-page-reveal dense-bento-section"
                      aria-labelledby={`board-section-${section.id}`}
                      style={{ animationDelay: `${0.34 + sectionIndex * 0.06}s` }}
                    >
                      <div className="dense-bento-section-heading mb-4 flex items-end justify-between gap-4">
                        <div>
                          <p id={`board-section-${section.id}`} className="future-kicker">
                            {section.label} ({section.items.length})
                          </p>
                          <p className="mt-1 max-w-[34rem] text-sm leading-6 text-[var(--color-text-muted)]">
                            {section.summary}
                          </p>
                        </div>
                      </div>

                      <div className={sectionBoardClass(section.items.length)}>
                        {section.items.map((announcement, index) => (
                          <article
                            key={announcement.id}
                            className={[
                              bentoTileClass(section.id, announcement, index, section.items.length),
                              isUrgentCard(announcement) ? 'urgent-bento-item' : '',
                            ]
                              .filter(Boolean)
                              .join(' ')}
                            data-bento-tile={section.id}
                            style={{
                              animationDelay: `${0.38 + (sectionIndex * 4 + index) * 0.045}s`,
                            }}
                          >
                            <AnnouncementCard
                              announcement={announcement}
                              visual={imageBentoVariant(announcement, index + sectionIndex * 2)}
                            />
                          </article>
                        ))}
                      </div>
                    </section>
                  ) : null
                )
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

// ── Utility functions (unchanged) ─────────────────────────────────────────────

function normalizeBoardSort(value?: string): BoardSort {
  return BOARD_SORTS.includes(value as BoardSort) ? (value as BoardSort) : 'priority'
}

function dateValue(iso?: string | null) {
  if (!iso) return 0
  const value = new Date(iso).getTime()
  return Number.isNaN(value) ? 0 : value
}

function futureDeadlineValue(iso?: string | null, now = Date.now()) {
  const value = dateValue(iso)
  return value > now ? value : Number.POSITIVE_INFINITY
}

function closingRank(announcement: AnnouncementWithRelations, now = Date.now()) {
  const deadline = futureDeadlineValue(announcement.expires_at, now)
  if (!Number.isFinite(deadline)) return 0
  const days = (deadline - now) / (24 * 60 * 60 * 1000)
  if (days <= 3) return 3
  if (days <= 7) return 2
  if (days <= 14) return 1
  return 0
}

function sortAnnouncementsForPublicBoard(
  announcements: AnnouncementWithRelations[],
  sort: BoardSort
) {
  const now = Date.now()

  return [...announcements].sort((a, b) => {
    if (sort === 'issued') {
      return dateValue(b.published_at) - dateValue(a.published_at)
    }

    if (sort === 'closing') {
      const deadlineDiff =
        futureDeadlineValue(a.expires_at, now) - futureDeadlineValue(b.expires_at, now)
      if (deadlineDiff !== 0) return deadlineDiff

      const urgencyDiff =
        URGENCY_META[normalizeAnnouncementUrgency(b.urgency)].rank -
        URGENCY_META[normalizeAnnouncementUrgency(a.urgency)].rank
      if (urgencyDiff !== 0) return urgencyDiff

      return dateValue(b.published_at) - dateValue(a.published_at)
    }

    const pinnedDiff = Number(isAnnouncementPinned(b, now)) - Number(isAnnouncementPinned(a, now))
    if (pinnedDiff !== 0) return pinnedDiff

    const urgencyDiff =
      URGENCY_META[normalizeAnnouncementUrgency(b.urgency)].rank -
      URGENCY_META[normalizeAnnouncementUrgency(a.urgency)].rank
    if (urgencyDiff !== 0) return urgencyDiff

    const closingDiff = closingRank(b, now) - closingRank(a, now)
    if (closingDiff !== 0) return closingDiff

    return dateValue(b.published_at) - dateValue(a.published_at)
  })
}

function buildFeedHref({ category, q, sort }: { category?: string; q?: string; sort: BoardSort }) {
  const params = new URLSearchParams()
  if (category) params.set('category', category)
  if (q) params.set('q', q)
  if (sort !== 'priority') params.set('sort', sort)
  const query = params.toString()
  return query ? `/?${query}` : '/'
}

function bentoTileClass(
  sectionId: BoardSectionId,
  announcement: AnnouncementWithRelations,
  index: number,
  sectionCount: number
) {
  const classes = ['public-page-reveal', 'dense-bento-item']
  const hasImage = Boolean(announcement.banner_url)
  const urgencyRank = URGENCY_META[normalizeAnnouncementUrgency(announcement.urgency)].rank
  const closingSoon = isClosingSoonForBoard(announcement.expires_at)

  if (sectionCount <= 2) {
    classes.push(index === 0 ? 'dense-bento-wide' : 'dense-bento-standard')
    return classes.join(' ')
  }

  if (sectionId === 'closing' && (index === 0 || closingSoon || urgencyRank > 0)) {
    classes.push('dense-bento-wide')
  } else if (hasImage && (index + 1) % 3 === 0) {
    classes.push('dense-bento-tall')
  } else if (!hasImage) {
    classes.push('dense-bento-compact')
  } else {
    classes.push('dense-bento-standard')
  }

  return classes.join(' ')
}

function sectionBoardClass(count: number) {
  const base = 'grid gap-4 md:grid-cols-2 xl:grid-cols-3'
  return count <= 2 ? `priority-lane-board ${base}` : `dense-bento-board ${base}`
}

function buildAnnouncementSections(announcements: AnnouncementWithRelations[], sort: BoardSort) {
  const order = boardSectionOrder(sort)
  const sections = new Map<BoardSectionId, AnnouncementWithRelations[]>(order.map((id) => [id, []]))
  const now = Date.now()

  announcements.forEach((announcement) => {
    const sectionId = order.find((id) => announcementMatchesSection(announcement, id, now))!
    sections.get(sectionId)!.push(announcement)
  })

  return order.map((id) => ({
    id,
    ...BOARD_SECTION_META[id],
    items: sections.get(id) ?? [],
  }))
}

function boardSectionOrder(sort: BoardSort): BoardSectionId[] {
  if (sort === 'closing') return ['closing', 'daily', 'future', 'campus']
  if (sort === 'issued') return ['daily', 'future', 'closing', 'campus']
  return ['daily', 'closing', 'future', 'campus']
}

function announcementMatchesSection(
  announcement: AnnouncementWithRelations,
  sectionId: BoardSectionId,
  now: number
) {
  if (sectionId === 'daily') return isIssuedToday(announcement.published_at, now)
  if (sectionId === 'closing') return isClosingSoonForBoard(announcement.expires_at, now)
  if (sectionId === 'future') return isFutureEventForBoard(announcement.expires_at, now)
  return true
}

function isIssuedToday(iso?: string | null, now = Date.now()) {
  if (!iso) return false
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return false
  const today = new Date(now)
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  )
}

function daysUntilDeadline(iso?: string | null, now = Date.now()) {
  const deadline = futureDeadlineValue(iso, now)
  if (!Number.isFinite(deadline)) return null
  return Math.ceil((deadline - now) / DAY_MS)
}

function isClosingSoonForBoard(iso?: string | null, now = Date.now()) {
  const days = daysUntilDeadline(iso, now)
  return days !== null && days <= 7
}

function isFutureEventForBoard(iso?: string | null, now = Date.now()) {
  const days = daysUntilDeadline(iso, now)
  return days !== null && days > 7
}

function imageBentoVariant(
  announcement: AnnouncementWithRelations,
  index: number,
  featured = false
): AnnouncementCardVisual {
  if (!announcement.banner_url) return 'letterbox'
  if (featured) return 'poster'

  const variants: AnnouncementCardVisual[] = ['letterbox', 'ribbon', 'letterbox', 'ribbon']
  return variants[index % variants.length]
}

function isUrgentCard(announcement: AnnouncementWithRelations): boolean {
  const rank = URGENCY_META[normalizeAnnouncementUrgency(announcement.urgency)].rank
  const days = daysUntilDeadline(announcement.expires_at)
  return rank > 0 || (days !== null && days <= 5)
}

function FilterSkeleton() {
  return (
    <div className="flex flex-wrap gap-2">
      {[40, 72, 64, 80, 56].map((width, index) => (
        <div key={index} className="skeleton-shimmer h-11 rounded-[0.9rem]" style={{ width }} />
      ))}
    </div>
  )
}

function EmptyState({ category, search }: { category?: string | null; search?: string }) {
  return (
    <div className="public-page-reveal future-bento-cell flex min-h-[38vh] flex-col items-center justify-center rounded-[1.75rem] px-5 py-16 text-center lg:min-h-[22rem]">
      <BrandMark size="lg" showText={false} className="campus-logo-halo mb-6 rounded-[1.35rem]" />
      <p className="font-display text-4xl leading-tight font-bold text-[var(--color-text-primary)] sm:text-5xl">
        No announcements
      </p>
      <p className="mt-4 max-w-[30rem] text-base leading-8 text-[var(--color-text-muted)]">
        {search
          ? 'No announcements match your search.'
          : category
            ? 'Try another category.'
            : 'Check back soon.'}
      </p>
      {(search || category) && (
        <Link
          href="/"
          className="action-lift mt-6 inline-flex min-h-12 items-center rounded-[1rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 text-base font-semibold text-[var(--color-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-inti)]"
        >
          Browse all
        </Link>
      )}
    </div>
  )
}
