import { Suspense } from 'react'
import Link from 'next/link'
import { getPublicAnnouncements, getActiveCategories } from '@/lib/data'
import { derivePublicTopics } from '@/lib/announcements/feed'
import AnnouncementCard from '@/components/announcements/AnnouncementCard'
import type { AnnouncementCardVisual } from '@/components/announcements/AnnouncementCard'
import CategoryFilter from '@/components/announcements/CategoryFilter'
import { PublicFeedAnalytics } from '@/components/analytics/PublicFeedAnalytics'
import { announcementPath } from '@/lib/announcements/urls'
import {
  buildAnnouncementSections,
  daysUntilDeadline,
  formatCampusLongDate,
  normalizeBoardSort,
  sortAnnouncementsForPublicBoard,
} from '@/lib/announcements/public-board'
import {
  URGENCY_META,
  isAnnouncementPinned,
  normalizeAnnouncementUrgency,
} from '@/lib/announcements/presentation'
import type { AnnouncementWithRelations } from '@/lib/types'
import { CampusMetric } from '@/components/public/CampusMetric'
import { FilterSkeleton } from '@/components/public/FilterSkeleton'
import { PublicEmptyState } from '@/components/public/PublicEmptyState'
import { BoardOrderControls } from '@/components/public/BoardOrderControls'
import { BoardStructurePanel } from '@/components/public/BoardStructurePanel'
import { FeedPagination } from '@/components/public/FeedPagination'
import { buildFeedHref } from '@/components/public/FeedHref'

export const metadata = { title: { absolute: 'Campus Bulletin' } }

export default async function PublicFeedPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string; sort?: string; page?: string }>
}) {
  const { category, q, sort, page } = await searchParams
  const search = q?.trim() ?? ''
  const activeSort = normalizeBoardSort(sort)
  const now = new Date().getTime()

  const [announcementPage, categories] = await Promise.all([
    getPublicAnnouncements(category, search, page),
    getActiveCategories(),
  ])
  const allAnnouncements = announcementPage.items
  const announcements = sortAnnouncementsForPublicBoard(allAnnouncements, activeSort, now)
  const topics = derivePublicTopics(categories, allAnnouncements)
  const totalAnnouncements = announcementPage.total

  const today = formatCampusLongDate(now)

  const pinnedHero = announcements.find((announcement) => isAnnouncementPinned(announcement, now))
  const featured =
    pinnedHero ?? announcements.find((announcement) => announcement.banner_url) ?? announcements[0]
  const featuredIsPinned = featured ? isAnnouncementPinned(featured, now) : false
  const rest = featured
    ? announcements.filter((announcement) => announcement.id !== featured.id)
    : announcements
  const boardSections = buildAnnouncementSections(rest, activeSort, now)
  const activeCategory = category ? topics.find((cat) => cat.slug === category)?.name : null
  const clearSearchHref = buildFeedHref({ category, sort: activeSort })
  const closingThisWeek = announcements.filter((a) => {
    const days = daysUntilDeadline(a.expires_at, now)
    return days !== null && days <= 7
  }).length
  const latestAnnouncement = announcements[0] ?? null
  const visibleStart =
    allAnnouncements.length > 0 ? (announcementPage.page - 1) * announcementPage.pageSize + 1 : 0
  const visibleEnd =
    allAnnouncements.length > 0
      ? Math.min(visibleStart + allAnnouncements.length - 1, announcementPage.total)
      : 0

  return (
    <div className="future-warm-plane min-h-[100dvh]">
      <PublicFeedAnalytics
        category={category ?? null}
        searchLength={search.length}
        sort={activeSort}
        page={announcementPage.page}
        visibleCount={announcements.length}
        total={totalAnnouncements}
      />
      <main id="main-content" className="w-full px-3 py-4 sm:px-5 sm:py-5 lg:px-8 lg:py-8">
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

              <div className="public-mobile-metrics mt-5 grid gap-2 sm:grid-cols-3 sm:gap-3">
                <CampusMetric value={totalAnnouncements} label="Live notices" />
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
                        {totalAnnouncements}
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
            count={totalAnnouncements}
          />

          {announcements.length === 0 ? (
            <PublicEmptyState category={activeCategory} search={search} />
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
                  {activeCategory ?? 'All topics'} · {totalAnnouncements} notices
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
                        featureLabel={featuredIsPinned ? 'Pinned' : 'Featured'}
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
                                bentoTileClass(announcement),
                                isUrgentCard(announcement, now)
                                  ? 'urgent-bento-item urgent-bento-corner'
                                  : '',
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

              {announcementPage.totalPages > 1 && (
                <FeedPagination
                  page={announcementPage.page}
                  totalPages={announcementPage.totalPages}
                  visibleStart={visibleStart}
                  visibleEnd={visibleEnd}
                  total={announcementPage.total}
                  category={category}
                  search={search}
                  activeSort={activeSort}
                />
              )}
            </section>
          )}
        </div>
      </main>
    </div>
  )
}

function bentoTileClass(announcement: AnnouncementWithRelations) {
  return `public-page-reveal dense-bento-item dense-bento-standard ${
    announcement.banner_url ? 'card-with-image' : 'card-without-image'
  }`
}

function sectionBoardClass(count: number) {
  const base = 'grid gap-4 md:grid-cols-2 xl:grid-cols-3'
  return count <= 2
    ? `priority-lane-board uniform-card-board ${base}`
    : `dense-bento-board uniform-card-board ${base}`
}

function imageBentoVariant(
  announcement: AnnouncementWithRelations,
  _index: number,
  featured = false
): AnnouncementCardVisual {
  if (featured && announcement.banner_url) return 'poster'
  return 'letterbox'
}

function isUrgentCard(announcement: AnnouncementWithRelations, now: number): boolean {
  const rank = URGENCY_META[normalizeAnnouncementUrgency(announcement.urgency)].rank
  const days = daysUntilDeadline(announcement.expires_at, now)
  return rank > 0 || (days !== null && days <= 5)
}
