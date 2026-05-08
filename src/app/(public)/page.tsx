import { Suspense } from 'react'
import Link from 'next/link'
import { getPublicAnnouncements, getActiveCategories } from '@/lib/data'
import AnnouncementCard from '@/components/announcements/AnnouncementCard'
import CategoryFilter from '@/components/announcements/CategoryFilter'
import { matchesSearch } from '@/lib/announcements/feed'
import { isAnnouncementPinned } from '@/lib/announcements/presentation'

export const metadata = { title: 'Announcements' }


export default async function PublicFeedPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>
}) {
  const { category, q } = await searchParams
  const search = q?.trim() ?? ''

  const [allAnnouncements, categories] = await Promise.all([
    getPublicAnnouncements(category),
    getActiveCategories(),
  ])
  const announcements = allAnnouncements.filter((announcement) =>
    matchesSearch(announcement, search)
  )

  const today = new Date().toLocaleDateString('en-MY', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const featured =
    announcements.find((announcement) => isAnnouncementPinned(announcement)) ??
    announcements.find((announcement) => announcement.banner_url) ??
    announcements[0]
  const rest = featured
    ? announcements.filter((announcement) => announcement.id !== featured.id)
    : []
  const activeCategory = category
    ? categories.find((cat) => cat.slug === category)?.name
    : null
  const clearSearchHref = category ? `/?category=${encodeURIComponent(category)}` : '/'

  return (
    <div className="min-h-[100dvh]">
      <main className="w-full px-4 py-6 sm:px-6 sm:py-10 lg:px-10 lg:py-12 xl:px-12">
        <div className="mx-auto flex w-full max-w-[90rem] flex-col gap-7 lg:gap-10">
          <section className="animate-fade-up grid gap-7 border-b border-[var(--color-border)] pb-7 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end lg:pb-10">
            <div className="max-w-[48rem]">
              <div className="mb-5 flex items-center gap-3">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: 'var(--color-accent-inti)' }}
                  aria-hidden="true"
                />
                <span
                  className="text-xs font-semibold uppercase"
                  style={{ color: 'var(--color-accent-inti)' }}
                >
                  INTI International University
                </span>
              </div>

              <h1
                className="font-display text-5xl font-bold leading-[0.92] sm:text-8xl lg:text-9xl"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Campus<br />Bulletin
              </h1>

              <p
                className="mt-5 max-w-[34rem] text-base leading-relaxed sm:mt-6 sm:text-xl"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Official updates, events, deadlines, and student opportunities from INTI International University.
              </p>
            </div>

            <div className="hidden border-t border-[var(--color-border)] pt-5 lg:block">
              <p className="text-sm font-medium text-[var(--color-text-muted)]">{today}</p>
              <div className="mt-5 grid grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <p className="font-mono text-3xl font-semibold text-[var(--color-text-primary)]">
                    {announcements.length}
                  </p>
                  <p className="mt-1 text-xs uppercase text-[var(--color-text-muted)]">Live posts</p>
                </div>
                <div>
                  <p className="font-mono text-3xl font-semibold text-[var(--color-text-primary)]">
                    {categories.length}
                  </p>
                  <p className="mt-1 text-xs uppercase text-[var(--color-text-muted)]">Categories</p>
                </div>
              </div>
            </div>
          </section>

          <section className="animate-fade-up delay-2 grid gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/55 p-2.5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start lg:gap-5 lg:p-4">
            <form action="/" className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] gap-2">
              {category && <input type="hidden" name="category" value={category} />}
              <label htmlFor="announcement-search" className="sr-only">
                Search announcements
              </label>
              <input
                id="announcement-search"
                name="q"
                type="search"
                defaultValue={search}
                placeholder="Search announcements..."
                className="min-h-11 min-w-0 flex-1 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 text-base text-[var(--color-text-primary)] outline-none transition-colors placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent-inti)] focus:bg-[var(--color-surface)]"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="min-h-11 rounded-[10px] bg-[var(--color-accent-inti)] px-5 text-base font-semibold text-white transition-transform active:scale-[0.98]"
                >
                  Search
                </button>
                {search && (
                  <Link
                    href={clearSearchHref}
                    className="inline-flex min-h-11 items-center rounded-[10px] border border-[var(--color-border)] px-4 text-base font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]"
                  >
                    Clear
                  </Link>
                )}
              </div>
            </form>

            <div className="lg:max-w-[34rem]">
              <Suspense fallback={<FilterSkeleton />}>
                <CategoryFilter categories={categories} />
              </Suspense>
            </div>
          </section>

          {announcements.length === 0 ? (
            <EmptyState category={activeCategory} search={search} />
          ) : (
            <div className="animate-fade-up delay-3 flex flex-col gap-8 lg:gap-10">
              {featured && (
                <section>
                  <p className="mb-3 text-xs font-semibold uppercase text-[var(--color-text-muted)]">
                    Featured
                  </p>
                  <AnnouncementCard announcement={featured} featured />
                </section>
              )}

              <section>
                <div className="mb-3 flex items-center justify-between gap-4 border-t border-[var(--color-border)] pt-5">
                  <p className="text-xs font-semibold uppercase text-[var(--color-text-muted)]">
                    All Announcements ({rest.length})
                  </p>
                  {activeCategory && (
                    <p className="text-xs font-medium text-[var(--color-text-muted)]">
                      {activeCategory}
                    </p>
                  )}
                </div>
                {rest.length === 0 ? (
                  <div className="border border-[var(--color-border)] bg-[var(--color-surface)]/55 px-6 py-10 text-base text-[var(--color-text-muted)]">
                    No more announcements match this view.
                  </div>
                ) : (
                  <div className="columns-1 gap-4 md:columns-2 xl:columns-3">
                    {rest.map((a, i) => (
                      <div
                        key={a.id}
                        className="mb-4 break-inside-avoid animate-fade-up"
                        style={{ animationDelay: `${0.36 + i * 0.06}s` }}
                      >
                        <AnnouncementCard announcement={a} />
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function FilterSkeleton() {
  return (
    <div className="flex flex-wrap gap-2">
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

function EmptyState({ category, search }: { category?: string | null; search?: string }) {
  return (
    <div className="animate-fade-up flex min-h-[38vh] flex-col items-center justify-center px-5 py-16 text-center lg:min-h-[22rem]">
      <div className="mb-5 flex items-center justify-center">
        <div className="h-px w-16" style={{ background: 'var(--color-border)' }} />
      </div>
      <p className="font-display text-3xl font-semibold leading-tight text-[var(--color-text-primary)] sm:text-4xl">
        No announcements
      </p>
      <p className="mt-3 max-w-[30rem] text-base leading-relaxed text-[var(--color-text-muted)]">
        {search
          ? 'No announcements match your search.'
          : category
            ? 'Try another category.'
            : 'Check back soon.'}
      </p>
      {(search || category) && (
        <Link
          href="/"
          className="mt-6 inline-flex min-h-10 items-center rounded-[10px] border border-[var(--color-border)] px-4 text-base font-semibold text-[var(--color-text-muted)] transition-[transform,color,border-color] duration-200 hover:-translate-y-0.5 hover:border-[var(--color-accent-inti)] hover:text-[var(--color-text-primary)] active:scale-[0.98]"
        >
          Browse all
        </Link>
      )}
    </div>
  )
}
