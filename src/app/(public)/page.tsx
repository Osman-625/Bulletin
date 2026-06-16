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
  normalizeBoardSort,
  selectPublicBoardHighlights,
} from '@/lib/announcements/public-board'
import { URGENCY_META, normalizeAnnouncementUrgency } from '@/lib/announcements/presentation'
import type { PublicAnnouncement } from '@/lib/types'
import { CampusMetric } from '@/components/public/CampusMetric'
import { FilterSkeleton } from '@/components/public/FilterSkeleton'
import { PublicEmptyState } from '@/components/public/PublicEmptyState'
import { BoardOrderControls } from '@/components/public/BoardOrderControls'
import { PinnedNoticesPanel } from '@/components/public/PinnedNoticesPanel'
import { FeedPagination } from '@/components/public/FeedPagination'
import { FeedNavigationProvider } from '@/components/public/FeedNavigation'
import { FeedPendingRegion } from '@/components/public/FeedPendingRegion'
import { buildFeedHref } from '@/components/public/FeedHref'

export const metadata = { title: { absolute: 'Campus Bulletin' } }

type PublicTopic = ReturnType<typeof derivePublicTopics>[number]
type PublicBoardSort = ReturnType<typeof normalizeBoardSort>
type PublicAnnouncementPage = Awaited<ReturnType<typeof getPublicAnnouncements>>

function PublicHeroSection({
  totalAnnouncements,
  topicsCount,
  newToday,
  closingThisWeek,
  latestAnnouncement,
}: {
  totalAnnouncements: number
  topicsCount: number
  newToday: number
  closingThisWeek: number
  latestAnnouncement: PublicAnnouncement | null
}) {
  return (
    <section className="public-board-grid" aria-labelledby="public-feed-title">
      <div className="public-board-hero public-board-main-column public-board-hero--compact public-page-reveal future-bento-cell min-w-0 rounded-[1.15rem] p-3.5 sm:p-4 lg:min-h-[13.5rem]">
        <div className="mb-3 flex flex-wrap items-center gap-2.5 sm:mb-4">
          <span className="future-kicker">INTI campus board</span>
          <span className="size-1.5 rounded-full bg-[var(--color-gold)]" aria-hidden="true" />
          <span className="font-mono text-[0.7rem] font-bold tracking-[0.14em] text-[var(--color-text-muted)] uppercase"></span>
        </div>

        <h1
          id="public-feed-title"
          className="font-display max-w-[42rem] text-4xl leading-[0.95] font-extrabold text-[var(--color-text-primary)] sm:text-5xl sm:leading-[0.94] lg:text-[3.35rem]"
        >
          Campus Bulletin
        </h1>

        <p className="mt-3 max-w-[34rem] text-base leading-[1.18] font-bold text-[var(--color-text-primary)] sm:text-lg">
          What&apos;s happening around INTI, in one place.
        </p>
        <p className="mt-2 max-w-[80rem] text-sm leading-[1.25] text-[var(--color-text-secondary)] sm:leading-6">
          Official notices, student club posts, deadlines, and campus events, all in one public
          board. Fast to scan between classes, easy to search by topic.
        </p>

        <div className="public-mobile-metrics mt-3 grid gap-2 sm:grid-cols-3">
          <CampusMetric value={totalAnnouncements} label="Live notices" />
          <CampusMetric value={topicsCount} label="Topics" />
          <CampusMetric value={newToday} label="New today" />
        </div>
      </div>

      <aside
        className="public-board-live-panel public-board-side-column public-page-reveal future-bento-cell hidden min-w-0 rounded-[1.15rem] p-3.5 delay-2 sm:p-4 lg:block"
        aria-label="Live board summary"
      >
        <div className="flex min-h-[10.25rem] flex-col justify-between">
          <div>
            <p className="future-kicker">Live board</p>
            <p className="font-display mt-1 max-w-[18rem] text-lg leading-[1.03] font-bold text-[var(--color-text-primary)] lg:text-[1.25rem]">
              What&apos;s happening right now.
            </p>
          </div>
          <div className="mt-2.5 grid gap-1.5">
            <div className="grid grid-cols-2 gap-2">
              <div className="public-board-stat rounded-[0.8rem] border p-2">
                <p className="font-mono text-lg leading-none font-bold text-[var(--color-text-primary)]">
                  {totalAnnouncements}
                </p>
                <p className="mt-1 font-mono text-[0.52rem] leading-[1.05] font-bold tracking-[0.12em] text-[var(--color-text-muted)] uppercase">
                  Live notices
                </p>
              </div>
              <div className="public-board-stat rounded-[0.8rem] border p-2">
                <p className="font-mono text-lg leading-none font-bold text-[var(--color-accent-inti)]">
                  {closingThisWeek}
                </p>
                <p className="mt-1 font-mono text-[0.52rem] leading-[1.05] font-bold tracking-[0.12em] text-[var(--color-text-muted)] uppercase">
                  Closing this week
                </p>
              </div>
            </div>
            {latestAnnouncement && (
              <Link
                href={announcementPath(latestAnnouncement)}
                className="public-board-latest block rounded-[0.8rem] border p-2 transition-[border-color,background,transform] duration-200 ease-[var(--ease-ui)] hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-inti)]"
              >
                <p className="font-mono text-[0.56rem] font-bold tracking-[0.12em] text-[var(--color-text-muted)] uppercase">
                  Latest notice
                </p>
                <p className="mt-1 line-clamp-2 text-[0.76rem] leading-snug font-bold text-[var(--color-text-primary)]">
                  {latestAnnouncement.title}
                </p>
              </Link>
            )}
            <Link
              href="#announcements"
              className="action-lift inline-flex min-h-11 items-center justify-center rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-semibold text-[var(--color-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-inti)]"
            >
              View all notices
            </Link>
          </div>
        </div>
      </aside>
    </section>
  )
}

function PublicSearchFilters({
  category,
  activeSort,
  search,
  clearSearchHref,
  topics,
}: {
  category: string | undefined
  activeSort: PublicBoardSort
  search: string
  clearSearchHref: string
  topics: PublicTopic[]
}) {
  return (
    <section
      className="mobile-search-dock public-board-toolbar public-board-span-full public-page-reveal future-bento-cell z-20 grid min-w-0 gap-2 rounded-[1.05rem] p-2.5 delay-3 sm:p-3 lg:grid-cols-[minmax(0,1fr)_fit-content(24rem)] lg:items-center"
      aria-label="Search and filters"
    >
      <form action="/" className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
        {category && <input type="hidden" name="category" value={category} />}
        {activeSort !== 'priority' && <input type="hidden" name="sort" value={activeSort} />}
        <label htmlFor="announcement-search" className="sr-only">
          Search announcements
        </label>
        <input
          id="announcement-search"
          name="q"
          type="search"
          defaultValue={search}
          placeholder="Search clubs, workshops, deadlines..."
          className="input-inti min-h-12 min-w-0 rounded-[0.85rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-base text-[var(--color-text-primary)] transition-[border-color,background,box-shadow] duration-300 ease-[var(--ease-ui)] outline-none placeholder:text-[var(--color-text-muted)]"
        />
        <div className="grid grid-cols-[1fr_auto] gap-2 sm:flex">
          <button
            type="submit"
            className="action-lift min-h-12 rounded-[10px] bg-[var(--color-accent-inti)] px-5 text-base font-semibold text-[var(--color-on-accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-inti)]"
          >
            Search
          </button>
          {search && (
            <Link
              href={clearSearchHref}
              className="inline-flex min-h-12 items-center rounded-[10px] border border-[var(--color-border)] px-4 text-base font-semibold text-[var(--color-text-muted)] transition-[border-color,color,transform] duration-300 ease-[var(--ease-ui)] hover:-translate-y-0.5 hover:border-[var(--color-accent-inti)] hover:text-[var(--color-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-inti)] active:scale-[0.98]"
            >
              Clear
            </Link>
          )}
        </div>
      </form>

      <div className="public-board-filter-inline min-w-0 lg:w-fit lg:justify-self-end">
        <Suspense fallback={<FilterSkeleton />}>
          <CategoryFilter categories={topics} />
        </Suspense>
      </div>
    </section>
  )
}

function PublicFeedLoadError({ retryHref }: { retryHref: string }) {
  return (
    <section
      className="public-page-reveal future-bento-cell rounded-[1.25rem] px-5 py-9 text-center sm:px-6 sm:py-10"
      role="alert"
      aria-live="polite"
    >
      <p className="future-kicker">Board unavailable</p>
      <h2 className="font-display mt-2 text-3xl leading-none font-extrabold text-[var(--color-text-primary)]">
        Bulletin could not load notices
      </h2>
      <p className="mx-auto mt-3 max-w-[34rem] text-sm leading-6 text-[var(--color-text-secondary)]">
        The public board hit a temporary problem. Try again to reload the latest campus notices.
      </p>
      <a
        href={retryHref}
        className="action-lift mt-6 inline-flex min-h-12 items-center justify-center rounded-[10px] bg-[var(--color-accent-inti)] px-5 text-base font-semibold text-[var(--color-on-accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-inti)]"
      >
        Try again
      </a>
    </section>
  )
}

function PublicAnnouncementFeed({
  announcements,
  rest,
  activeSort,
  activeCategory,
  totalAnnouncements,
  announcementPage,
  visibleStart,
  visibleEnd,
  category,
  search,
  now,
}: {
  announcements: PublicAnnouncement[]
  rest: PublicAnnouncement[]
  activeSort: PublicBoardSort
  activeCategory: string | null
  totalAnnouncements: number
  announcementPage: PublicAnnouncementPage
  visibleStart: number
  visibleEnd: number
  category: string | undefined
  search: string
  now: number
}) {
  const boardSections = buildAnnouncementSections(rest, activeSort, now)

  if (announcements.length === 0) {
    return <PublicEmptyState category={activeCategory} search={search} />
  }

  return (
    <section
      id="announcements"
      className="public-page-reveal scroll-mt-28 delay-4 md:scroll-mt-24"
      aria-label="Announcement feed"
    >
      <div className="dense-bento-section-heading mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="future-kicker">Campus notices</p>
          <h2 className="font-display mt-1 text-3xl leading-none font-extrabold text-[var(--color-text-primary)]">
            Announcements
          </h2>
        </div>
        <p className="text-sm font-semibold text-[var(--color-text-muted)]">
          {activeCategory ?? 'All topics'} · {totalAnnouncements} notices
        </p>
      </div>

      <FeedPendingRegion>
        <div className="flex flex-col gap-3 md:gap-4" data-layout-source-guard="gap-3 md:gap-4">
          {rest.length === 0 ? (
            <div className="dense-bento-item future-bento-cell rounded-[1.25rem] px-6 py-10 text-base text-[var(--color-text-muted)] xl:max-w-[31rem]">
              All matching notices are shown above.
            </div>
          ) : (
            <div
              className={sectionBoardClass(rest.length)}
              data-board-flow={activeSort === 'priority' ? 'dense' : 'ordered'}
              data-board-section-count={
                boardSections.filter((section) => section.items.length > 0).length
              }
            >
              {rest.map((announcement, index) => (
                <article
                  key={announcement.id}
                  className={[
                    bentoTileClass(announcement),
                    isUrgentCard(announcement, now) ? 'urgent-bento-item urgent-bento-corner' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  data-bento-tile="announcements"
                  style={{
                    animationDelay: `${Math.min(0.22, 0.08 + index * 0.012)}s`,
                  }}
                >
                  <AnnouncementCard
                    announcement={announcement}
                    visual={imageBentoVariant(announcement, index)}
                  />
                </article>
              ))}
            </div>
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
      </FeedPendingRegion>
    </section>
  )
}

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
    getPublicAnnouncements(category, search, page, activeSort, now),
    getActiveCategories(),
  ])
  const allAnnouncements = announcementPage.items
  const announcements = allAnnouncements
  const topics = derivePublicTopics(categories, allAnnouncements)
  const totalAnnouncements = announcementPage.total

  const { featured, featuredIsPinned, pinnedFeatures, rest } = selectPublicBoardHighlights(
    announcements,
    now
  )
  const sideFeatureNotices = pinnedFeatures.length > 0 ? pinnedFeatures : rest.slice(0, 3)
  const activeCategory = category
    ? (topics.find((cat) => cat.slug === category)?.name ?? category)
    : null
  const clearSearchHref = buildFeedHref({ category, sort: activeSort })
  const retryHref = buildFeedHref({
    category,
    q: search,
    sort: activeSort,
    page: announcementPage.page,
  })
  // Hero stats come from the full filtered result set, not the current page.
  const { closingThisWeek, latest: latestAnnouncement, publishedToday } = announcementPage.stats
  const visibleStart =
    allAnnouncements.length > 0 ? (announcementPage.page - 1) * announcementPage.pageSize + 1 : 0
  const visibleEnd =
    allAnnouncements.length > 0
      ? Math.min(visibleStart + allAnnouncements.length - 1, announcementPage.total)
      : 0

  return (
    <div className="public-board-canvas min-h-[100dvh]">
      <PublicFeedAnalytics
        category={category ?? null}
        searchLength={search.length}
        sort={activeSort}
        page={announcementPage.page}
        visibleCount={announcements.length}
        total={totalAnnouncements}
      />
      <main id="main-content" className="w-full py-3 sm:py-4">
        <div className="public-board-frame public-layout-inner flex flex-col gap-3 md:gap-4">
          <PublicHeroSection
            totalAnnouncements={totalAnnouncements}
            topicsCount={topics.length}
            newToday={publishedToday}
            closingThisWeek={closingThisWeek}
            latestAnnouncement={latestAnnouncement}
          />

          <FeedNavigationProvider>
            <PublicSearchFilters
              category={category}
              activeSort={activeSort}
              search={search}
              clearSearchHref={clearSearchHref}
              topics={topics}
            />

            <BoardOrderControls
              activeSort={activeSort}
              category={category}
              search={search}
              activeCategory={activeCategory}
              count={totalAnnouncements}
            />

            {announcementPage.error ? (
              <PublicFeedLoadError retryHref={retryHref} />
            ) : (
              <>
                {featured && (
                  <section
                    className={`public-featured-grid public-board-grid ${
                      sideFeatureNotices.length === 0 ? 'public-featured-single' : ''
                    }`}
                    aria-label="Featured and pinned notices"
                  >
                    <p className="future-kicker public-board-span-full">
                      {featuredIsPinned ? 'Pinned notice' : 'Featured notice'}
                    </p>
                    <article
                      className="public-page-reveal hero-poster-card public-featured-compact public-board-main-column"
                      data-bento-tile="featured"
                    >
                      <AnnouncementCard
                        announcement={featured}
                        featured
                        featureLabel={featuredIsPinned ? 'Pinned' : 'Featured'}
                        visual={imageBentoVariant(featured, 0, true)}
                      />
                    </article>
                    <PinnedNoticesPanel
                      pins={sideFeatureNotices}
                      mode={pinnedFeatures.length > 0 ? 'pinned' : 'priority'}
                      now={now}
                    />
                  </section>
                )}

                <PublicAnnouncementFeed
                  announcements={announcements}
                  rest={rest}
                  activeSort={activeSort}
                  activeCategory={activeCategory}
                  totalAnnouncements={totalAnnouncements}
                  announcementPage={announcementPage}
                  visibleStart={visibleStart}
                  visibleEnd={visibleEnd}
                  category={category}
                  search={search}
                  now={now}
                />
              </>
            )}
          </FeedNavigationProvider>
        </div>
      </main>
    </div>
  )
}

function bentoTileClass(announcement: PublicAnnouncement) {
  return `public-page-reveal dense-bento-item dense-bento-standard ${
    announcement.banner_url ? 'card-with-image' : 'card-without-image'
  }`
}

function sectionBoardClass(count: number) {
  const base = 'public-feed-card-board grid gap-3 md:gap-4'
  return count <= 2
    ? `priority-lane-board uniform-card-board ${base}`
    : `dense-bento-board uniform-card-board ${base}`
}

function imageBentoVariant(
  announcement: PublicAnnouncement,
  _index: number,
  featured = false
): AnnouncementCardVisual {
  if (featured && announcement.banner_url) return 'poster'
  return 'letterbox'
}

function isUrgentCard(announcement: PublicAnnouncement, now: number): boolean {
  const rank = URGENCY_META[normalizeAnnouncementUrgency(announcement.urgency)].rank
  const days = daysUntilDeadline(announcement.expires_at, now)
  return rank > 0 || (days !== null && days <= 5)
}
