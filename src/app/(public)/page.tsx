import { Suspense } from 'react'
import Link from 'next/link'
import { getPublicAnnouncements, getActiveCategories } from '@/lib/data'
import { derivePublicTopics } from '@/lib/announcements/feed'
import AnnouncementCard from '@/components/announcements/AnnouncementCard'
import type { AnnouncementCardVisual } from '@/components/announcements/AnnouncementCard'
import CategoryFilter from '@/components/announcements/CategoryFilter'
import { BrandMark } from '@/components/layout/BrandMark'
import { announcementPath } from '@/lib/announcements/urls'
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

  const pinnedHero = announcements.find((announcement) => isAnnouncementPinned(announcement))
  const featured =
    pinnedHero ?? announcements.find((announcement) => announcement.banner_url) ?? announcements[0]
  const featuredIsPinned = featured ? isAnnouncementPinned(featured) : false
  const rest = featured
    ? announcements.filter((announcement) => announcement.id !== featured.id)
    : announcements
  const boardSections = buildAnnouncementSections(rest, activeSort)
  const activeCategory = category ? topics.find((cat) => cat.slug === category)?.name : null
  const clearSearchHref = buildFeedHref({ category, sort: activeSort })
  const closingThisWeek = announcements.filter((a) => {
    const days = daysUntilDeadline(a.expires_at)
    return days !== null && days <= 7
  }).length
  const latestAnnouncement = announcements[0] ?? null

  return (
    <div className="future-warm-plane min-h-[100dvh]">
      <main className="w-full px-3 py-4 sm:px-5 sm:py-5 lg:px-8 lg:py-8">
        <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-4 md:gap-5 lg:gap-6">
          <section
            className="grid gap-3 md:grid-cols-[minmax(0,1.45fr)_minmax(15rem,0.75fr)] lg:grid-cols-12"
            aria-labelledby="public-feed-title"
          >
            <div className="public-page-reveal future-bento-cell rounded-[1.25rem] p-4 sm:p-5 md:p-6 lg:col-span-8 lg:min-h-[26rem] lg:p-8 xl:min-h-[28rem]">
              <div className="mb-4 flex flex-wrap items-center gap-3 sm:mb-5">
                <span className="future-kicker">INTI campus board</span>
                <span
                  className="h-1.5 w-1.5 rounded-full bg-[var(--color-gold)]"
                  aria-hidden="true"
                />
                <span className="font-mono text-[0.7rem] font-bold tracking-[0.14em] text-[var(--color-text-muted)] uppercase">
                  Clubs / Careers / Student Life / Workshops
                </span>
              </div>

              <h1
                id="public-feed-title"
                className="font-display max-w-[44rem] text-4xl leading-[0.95] font-extrabold text-[var(--color-text-primary)] sm:text-5xl md:text-6xl lg:text-8xl"
              >
                Campus Bulletin
              </h1>

              <p className="mt-4 max-w-[38rem] text-xl leading-[1.12] font-bold text-[var(--color-text-primary)] sm:text-2xl md:text-3xl">
                What&apos;s happening around INTI, in one place.
              </p>
              <p className="mt-3 max-w-[39rem] text-sm leading-6 text-[var(--color-text-muted)] sm:text-base sm:leading-7">
                Official notices, student club posts, deadlines, and campus events — all in one
                public board. Fast to scan between classes, easy to search by topic.
              </p>

              <div className="mt-5 hidden gap-3 sm:grid sm:grid-cols-3">
                <CampusMetric value={announcements.length} label="Live notices" />
                <CampusMetric value={topics.length} label="Topics" />
                <CampusMetric value={today} label="Today" wide />
              </div>
            </div>

            <aside
              className="public-page-reveal future-bento-cell hidden rounded-[1.25rem] p-5 delay-2 md:block lg:col-span-4 lg:p-6"
              aria-label="Live board summary"
            >
              <div className="flex h-full min-h-[18rem] flex-col justify-between">
                <div>
                  <p className="future-kicker">Live board</p>
                  <p className="font-display mt-3 max-w-[18rem] text-3xl leading-[1.05] font-bold text-[var(--color-text-primary)] sm:text-4xl">
                    What&apos;s happening right now.
                  </p>
                </div>
                <div className="mt-6 grid gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      className="rounded-[1.15rem] bg-[var(--color-surface)]/72 p-4"
                      style={{ border: '1px solid var(--color-border-subtle)' }}
                    >
                      <p className="font-mono text-3xl leading-none font-bold text-[var(--color-text-primary)]">
                        {announcements.length}
                      </p>
                      <p className="mt-2 font-mono text-[0.65rem] font-bold tracking-[0.14em] text-[var(--color-text-muted)] uppercase">
                        Live notices
                      </p>
                    </div>
                    <div
                      className="rounded-[1.15rem] bg-[var(--color-surface)]/72 p-4"
                      style={{ border: '1px solid var(--color-border-subtle)' }}
                    >
                      <p className="font-mono text-3xl leading-none font-bold text-[var(--color-accent-inti)]">
                        {closingThisWeek}
                      </p>
                      <p className="mt-2 font-mono text-[0.65rem] font-bold tracking-[0.14em] text-[var(--color-text-muted)] uppercase">
                        Closing this week
                      </p>
                    </div>
                  </div>
                  {latestAnnouncement && (
                    <Link
                      href={announcementPath(latestAnnouncement)}
                      className="block rounded-[1.15rem] bg-[var(--color-surface)]/72 p-4 transition-colors duration-200 hover:bg-[var(--color-surface-elevated)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-inti)]"
                      style={{ border: '1px solid var(--color-border-subtle)' }}
                    >
                      <p className="font-mono text-[0.65rem] font-bold tracking-[0.14em] text-[var(--color-text-muted)] uppercase">
                        Latest notice
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm leading-snug font-bold text-[var(--color-text-primary)]">
                        {latestAnnouncement.title}
                      </p>
                    </Link>
                  )}
                  <Link
                    href="#announcements"
                    className="action-lift inline-flex min-h-11 items-center justify-center rounded-[1rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-semibold text-[var(--color-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-inti)]"
                  >
                    View all notices
                  </Link>
                </div>
              </div>
            </aside>
          </section>

          <section
            className="mobile-search-dock public-page-reveal z-20 grid gap-2 delay-3 md:grid-cols-[minmax(0,1.15fr)_minmax(16rem,0.85fr)] lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]"
            aria-label="Search and filters"
          >
            <div className="future-bento-cell rounded-[1.05rem] p-2.5 shadow-[var(--shadow-soft)] sm:p-3 lg:shadow-none">
              <form
                action="/"
                className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]"
              >
                {category && <input type="hidden" name="category" value={category} />}
                {activeSort !== 'priority' && (
                  <input type="hidden" name="sort" value={activeSort} />
                )}
                <label htmlFor="announcement-search" className="sr-only">
                  Search announcements
                </label>
                <input
                  id="announcement-search"
                  name="q"
                  type="search"
                  defaultValue={search}
                  placeholder="Search clubs, workshops, deadlines..."
                  className="input-inti min-h-12 min-w-0 rounded-[1rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-base text-[var(--color-text-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.42)] transition-[border-color,background,box-shadow] duration-300 ease-[var(--ease-ui)] outline-none placeholder:text-[var(--color-text-muted)]"
                />
                <div className="grid grid-cols-[1fr_auto] gap-2 sm:flex">
                  <button
                    type="submit"
                    className="action-lift min-h-12 rounded-[1rem] bg-[var(--color-accent-inti)] px-5 text-base font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-inti)]"
                  >
                    Search
                  </button>
                  {search && (
                    <Link
                      href={clearSearchHref}
                      className="inline-flex min-h-12 items-center rounded-[1rem] border border-[var(--color-border)] px-4 text-base font-semibold text-[var(--color-text-muted)] transition-[border-color,color,transform] duration-300 ease-[var(--ease-ui)] hover:-translate-y-0.5 hover:border-[var(--color-accent-inti)] hover:text-[var(--color-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-inti)] active:scale-[0.98]"
                    >
                      Clear
                    </Link>
                  )}
                </div>
              </form>
            </div>

            <div className="future-bento-cell rounded-[1.05rem] p-2.5 shadow-[var(--shadow-soft)] sm:p-3 lg:shadow-none">
              <Suspense fallback={<FilterSkeleton />}>
                <CategoryFilter categories={topics} />
              </Suspense>
            </div>
          </section>

          <BoardOrderControls
            activeSort={activeSort}
            category={category}
            search={search}
            activeCategory={activeCategory}
            count={announcements.length}
          />

          {announcements.length === 0 ? (
            <EmptyState category={activeCategory} search={search} />
          ) : (
            <section
              id="announcements"
              className="public-page-reveal delay-4"
              aria-label="Announcement feed"
            >
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="future-kicker">Campus notices</p>
                  <h2 className="font-display mt-1 text-3xl leading-none font-bold text-[var(--color-text-primary)]">
                    Announcements
                  </h2>
                </div>
                <p className="text-sm font-semibold text-[var(--color-text-muted)]">
                  {activeCategory ?? 'All topics'} · {announcements.length} notices
                </p>
              </div>

              <div className="flex flex-col gap-12 md:gap-14">
                {featured && (
                  <div className="grid gap-4 xl:grid-cols-3 xl:items-stretch">
                    <article
                      className="public-page-reveal hero-poster-card xl:col-span-2"
                      data-bento-tile="featured"
                    >
                      <p className="future-kicker mb-2">
                        {featuredIsPinned ? 'Pinned notice' : 'Featured notice'}
                      </p>
                      <AnnouncementCard
                        announcement={featured}
                        featured
                        visual={imageBentoVariant(featured, 0, true)}
                      />
                    </article>

                    <BoardStructurePanel
                      activeSort={activeSort}
                      featuredIsPinned={featuredIsPinned}
                    />
                  </div>
                )}

                {boardSections.every((section) => section.items.length === 0) ? (
                  <div className="dense-bento-item future-bento-cell rounded-[1.25rem] px-6 py-10 text-base text-[var(--color-text-muted)] xl:max-w-[31rem]">
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
                          {sectionIndex === 0 && (
                            <Link
                              href="/#announcements"
                              className="hidden text-sm font-semibold text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)] sm:inline"
                            >
                              Browse board
                            </Link>
                          )}
                        </div>

                        <div className={sectionBoardClass(section.items.length)}>
                          {section.items.map((announcement, index) => (
                            <article
                              key={announcement.id}
                              className={[
                                bentoTileClass(
                                  section.id,
                                  announcement,
                                  index,
                                  section.items.length
                                ),
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
            </section>
          )}
        </div>
      </main>
    </div>
  )
}

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

function BoardOrderControls({
  activeSort,
  category,
  search,
  activeCategory,
  count,
}: {
  activeSort: BoardSort
  category?: string
  search: string
  activeCategory?: string | null
  count: number
}) {
  const activeOption = BOARD_SORT_OPTIONS.find((option) => option.sort === activeSort)!

  return (
    <section
      className="public-page-reveal future-bento-cell hidden gap-4 rounded-[1.35rem] p-4 delay-4 lg:grid lg:grid-cols-[minmax(16rem,0.55fr)_minmax(0,1fr)] lg:items-center"
      aria-labelledby="board-order-title"
    >
      <div>
        <p className="future-kicker">{activeOption.eyebrow}</p>
        <h2
          id="board-order-title"
          className="font-display mt-2 text-3xl leading-none font-bold text-[var(--color-text-primary)]"
        >
          {activeOption.label}
        </h2>
        <p className="mt-2 max-w-[30rem] text-sm leading-6 text-[var(--color-text-muted)]">
          {activeCategory ?? 'All topics'} · {count} visible notices
        </p>
      </div>

      <nav className="grid gap-2 sm:grid-cols-3" aria-label="Sort order">
        {BOARD_SORT_OPTIONS.map((option) => {
          const active = option.sort === activeSort

          return (
            <Link
              key={option.sort}
              href={buildFeedHref({ category, q: search, sort: option.sort })}
              data-sort={option.sort}
              aria-current={active ? 'true' : undefined}
              className="group min-h-24 rounded-[1rem] border p-4 transition-[background,border-color,box-shadow,transform,color] duration-300 ease-[var(--ease-ui)] hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-inti)] active:scale-[0.99]"
              style={{
                background: active ? 'var(--color-text-primary)' : 'var(--color-surface)',
                borderColor: active ? 'var(--color-text-primary)' : 'var(--color-border)',
                boxShadow: active ? 'var(--shadow-button-hover)' : 'none',
                color: active ? 'var(--color-canvas)' : 'var(--color-text-primary)',
              }}
            >
              <span className="font-mono text-[0.64rem] font-bold tracking-[0.16em] uppercase opacity-70">
                {option.eyebrow}
              </span>
              <span className="mt-2 block text-base leading-tight font-bold">{option.label}</span>
              <span className="mt-1 block text-xs leading-5 opacity-72">{option.summary}</span>
            </Link>
          )
        })}
      </nav>
    </section>
  )
}

function BoardStructurePanel({
  activeSort,
  featuredIsPinned,
}: {
  activeSort: BoardSort
  featuredIsPinned: boolean
}) {
  const rows = [
    {
      label: featuredIsPinned ? 'Pinned first' : 'Featured first',
      summary: featuredIsPinned ? 'Pinned notices are promoted first.' : 'A useful notice leads.',
    },
    { label: 'New today', summary: 'Fresh notices from today.' },
    { label: 'Closing soon', summary: 'Deadlines move up when selected.' },
    { label: 'Plan ahead', summary: 'Upcoming notices with time to plan.' },
  ]

  return (
    <aside
      className="future-bento-cell hidden rounded-[1.35rem] p-5 xl:flex xl:flex-col xl:justify-between"
      aria-label="Board order structure"
    >
      <div>
        <p className="future-kicker">Board order</p>
        <h3 className="font-display mt-2 text-3xl leading-none font-bold text-[var(--color-text-primary)]">
          How we sort this board
        </h3>
        <p className="mt-3 text-sm leading-6 text-[var(--color-text-muted)]">
          Sorted by: {BOARD_SORT_OPTIONS.find((option) => option.sort === activeSort)?.label}
        </p>
      </div>

      <div className="mt-6 grid gap-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="rounded-[0.95rem] border bg-[var(--color-surface)] px-4 py-3"
            style={{ borderColor: 'var(--color-border-subtle)' }}
          >
            <p className="text-base leading-tight font-bold text-[var(--color-text-primary)]">
              {row.label}
            </p>
            <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">{row.summary}</p>
          </div>
        ))}
      </div>
    </aside>
  )
}

function CampusMetric({
  value,
  label,
  wide = false,
}: {
  value: number | string
  label: string
  wide?: boolean
}) {
  return (
    <div
      className={
        wide
          ? 'rounded-[1.15rem] bg-[var(--color-surface)]/72 p-4 sm:col-span-1'
          : 'rounded-[1.15rem] bg-[var(--color-surface)]/72 p-4'
      }
      style={{ border: '1px solid var(--color-border-subtle)' }}
    >
      <p
        className={
          wide
            ? 'font-mono text-sm leading-5 font-bold text-[var(--color-text-primary)] sm:text-base'
            : 'font-mono text-3xl leading-none font-bold text-[var(--color-text-primary)]'
        }
      >
        {value}
      </p>
      <p className="mt-2 font-mono text-[0.65rem] font-bold tracking-[0.14em] text-[var(--color-text-muted)] uppercase">
        {label}
      </p>
    </div>
  )
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
