import type { CSSProperties } from 'react'

function Bone({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return (
    <div aria-hidden="true" className={`skeleton-shimmer rounded ${className}`} style={style} />
  )
}

function LoadingAnnouncementCard({ poster = false }: { poster?: boolean }) {
  return (
    <div className="future-bento-cell overflow-hidden rounded-[1.25rem]">
      {poster && <div className="h-44 bg-[var(--color-surface-elevated)] sm:h-60" />}
      <div className="flex flex-col gap-4 p-5">
        <div className="flex gap-2">
          <Bone className="h-8 w-24 rounded-md" />
          <Bone className="h-8 w-20 rounded-md" />
        </div>
        <div className="flex flex-col gap-2">
          <Bone className="h-6 w-full rounded-md" />
          <Bone className="h-6 w-4/5 rounded-md" />
        </div>
        <div className="flex flex-col gap-2">
          <Bone className="h-4 w-full" />
          <Bone className="h-4 w-5/6" />
        </div>
        <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-4">
          <Bone className="h-3 w-28" />
          <Bone className="h-3 w-20" />
        </div>
      </div>
    </div>
  )
}

function LoadingAnnouncementCardCompact() {
  return (
    <div className="future-bento-cell overflow-hidden rounded-[1.25rem]">
      <div className="flex flex-col gap-3 p-5">
        <Bone className="h-6 w-20 rounded-md" />
        <div className="flex flex-col gap-2">
          <Bone className="h-5 w-full rounded-md" />
          <Bone className="h-5 w-3/4 rounded-md" />
        </div>
        <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-3">
          <Bone className="h-3 w-24" />
          <Bone className="h-3 w-16" />
        </div>
      </div>
    </div>
  )
}

export default function PublicLoading() {
  return (
    <div className="public-board-canvas min-h-[100dvh]">
      <main id="main-content" className="w-full py-3 sm:py-4">
        <div className="public-board-frame public-layout-inner flex flex-col gap-3 md:gap-4">
          {/* ── Hero ── */}
          <section className="public-board-grid" aria-label="Loading campus bulletin">
            {/* Main column */}
            <div className="public-board-hero public-board-main-column public-board-hero--compact future-bento-cell min-w-0 rounded-[1.15rem] p-3.5 sm:p-4 lg:min-h-[13.5rem]">
              {/* Kicker row */}
              <div className="mb-3 flex flex-wrap items-center gap-2.5">
                <Bone className="h-[1em] w-32 rounded-sm" style={{ fontSize: '0.68rem' }} />
                <Bone className="size-1.5 rounded-full" />
                <Bone className="h-[1em] w-20 rounded-sm" style={{ fontSize: '0.7rem' }} />
              </div>
              {/* h1 "Campus Bulletin" — text-4xl sm:text-5xl lg:text-[3.35rem], line-height 0.95 */}
              <Bone
                className="h-[0.95em] w-3/4 max-w-[34rem] rounded-lg"
                style={{ fontSize: 'clamp(2.25rem, 3.5vw, 3.35rem)' }}
              />
              {/* Subtitle — text-base sm:text-lg, font-bold */}
              <Bone
                className="mt-3 h-[1em] w-2/3 max-w-[26rem] rounded-md"
                style={{ fontSize: '1.125rem' }}
              />
              {/* Body text — text-sm */}
              <Bone className="mt-2 h-[1em] w-full rounded-sm" style={{ fontSize: '0.875rem' }} />
              {/* Campus metrics — mirrors CampusMetric × 3 */}
              <div className="public-mobile-metrics mt-3 grid gap-2 sm:grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="public-board-metric rounded-[1rem] border p-3">
                    <Bone className="h-[1em] w-10 rounded-md" style={{ fontSize: '1.5rem' }} />
                    <Bone
                      className="mt-1.5 h-[1em] w-16 rounded-sm"
                      style={{ fontSize: '0.62rem' }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Side panel — mirrors .public-board-live-panel structure */}
            <aside className="public-board-live-panel public-board-side-column future-bento-cell hidden min-w-0 rounded-[1.15rem] p-3.5 sm:p-4 lg:block">
              <div className="flex min-h-[10.25rem] flex-col justify-between">
                <div>
                  <Bone className="h-[1em] w-20 rounded-sm" style={{ fontSize: '0.68rem' }} />
                  <Bone className="mt-1 h-[1em] w-48 rounded-md" style={{ fontSize: '1.25rem' }} />
                </div>
                <div className="mt-2.5 grid gap-1.5">
                  {/* Two stat boxes — mirror .public-board-stat */}
                  <div className="grid grid-cols-2 gap-2">
                    {[0, 1].map((i) => (
                      <div key={i} className="public-board-stat rounded-[0.8rem] border p-2">
                        <Bone className="h-[1em] w-8 rounded-sm" style={{ fontSize: '1.125rem' }} />
                        <Bone
                          className="mt-1 h-[1em] w-16 rounded-sm"
                          style={{ fontSize: '0.52rem' }}
                        />
                      </div>
                    ))}
                  </div>
                  {/* Latest notice — mirrors .public-board-latest */}
                  <div className="public-board-latest rounded-[0.8rem] border p-2">
                    <Bone className="h-[1em] w-16 rounded-sm" style={{ fontSize: '0.56rem' }} />
                    <Bone
                      className="mt-1 h-[1em] w-full rounded-sm"
                      style={{ fontSize: '0.76rem' }}
                    />
                    <Bone
                      className="mt-1 h-[1em] w-4/5 rounded-sm"
                      style={{ fontSize: '0.76rem' }}
                    />
                  </div>
                  {/* "View all" button */}
                  <Bone className="min-h-11 w-full rounded-[10px]" />
                </div>
              </div>
            </aside>
          </section>

          {/* ── Search + category filters ── */}
          {/* Mirrors PublicSearchFilters — one section, two-column at lg */}
          <section className="mobile-search-dock public-board-toolbar public-board-span-full future-bento-cell z-20 grid min-w-0 gap-2 rounded-[1.05rem] p-2.5 sm:p-3 lg:grid-cols-[minmax(0,1fr)_fit-content(24rem)] lg:items-center">
            <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <Bone className="min-h-12 rounded-[0.85rem]" />
              <Bone className="min-h-12 w-full rounded-[10px] sm:w-24" />
            </div>
            <div className="public-board-filter-inline flex min-w-0 flex-wrap gap-2">
              {[64, 104, 92, 112, 88].map((w) => (
                <Bone key={w} className="min-h-11 rounded-[0.9rem]" style={{ width: w }} />
              ))}
            </div>
          </section>

          {/* ── Sort / order controls ── */}
          {/* Mirrors BoardOrderControls — info column + 3-slot nav */}
          <section className="public-board-sort public-board-sort-bar public-board-order public-board-span-full future-bento-cell grid min-w-0 gap-2 rounded-[1rem] p-1.5 sm:p-2 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-center">
            <div className="min-w-0 px-1 lg:w-[10rem]">
              <Bone className="h-[1em] w-20 rounded-sm" style={{ fontSize: '0.68rem' }} />
              <Bone className="mt-0.5 h-[1em] w-32 rounded-md" style={{ fontSize: '0.875rem' }} />
              <Bone className="mt-0.5 h-[1em] w-44 rounded-sm" style={{ fontSize: '0.72rem' }} />
            </div>
            <nav className="grid min-w-0 grid-cols-3 gap-1 overflow-visible rounded-[var(--radius-control)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] p-0.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="min-h-11 rounded-[0.55rem] p-2">
                  <Bone className="h-[1em] w-14 rounded-sm" style={{ fontSize: '0.56rem' }} />
                  <Bone
                    className="mt-0.5 h-[1em] w-20 rounded-sm"
                    style={{ fontSize: '0.84rem' }}
                  />
                </div>
              ))}
            </nav>
          </section>

          {/* ── Featured + pinned notices ── */}
          {/* Mirrors the public-featured-grid section + PinnedNoticesPanel */}
          <section className="public-featured-grid public-board-grid">
            <Bone
              className="public-board-span-full h-[1em] w-28 rounded-sm"
              style={{ fontSize: '0.68rem' }}
            />
            <article className="hero-poster-card public-featured-compact public-board-main-column">
              <LoadingAnnouncementCard poster />
            </article>
            <aside className="public-board-pins public-board-side-column grid min-w-0 gap-3 overflow-visible pb-0 md:grid-cols-2 lg:h-full lg:auto-rows-fr lg:grid-cols-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="public-board-pin-card future-bento-cell flex min-h-[5.6rem] flex-col justify-start gap-2 rounded-[1rem] p-3 sm:p-3.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Bone className="h-[1em] w-14 rounded-sm" style={{ fontSize: '0.68rem' }} />
                    <Bone className="size-2 rounded-full" />
                  </div>
                  <div>
                    <Bone className="h-[1em] w-full rounded-md" style={{ fontSize: '1rem' }} />
                    <Bone className="mt-1 h-[1em] w-4/5 rounded-md" style={{ fontSize: '1rem' }} />
                    <Bone
                      className="mt-1 h-[1em] w-32 rounded-sm"
                      style={{ fontSize: '0.75rem' }}
                    />
                  </div>
                </div>
              ))}
            </aside>
          </section>

          {/* ── Feed ── */}
          {/* Mirrors PublicAnnouncementFeed heading + dense-bento-board grid */}
          <section>
            <div className="dense-bento-section-heading mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <Bone className="h-[1em] w-28 rounded-sm" style={{ fontSize: '0.68rem' }} />
                <Bone className="mt-1 h-[1em] w-44 rounded-lg" style={{ fontSize: '1.875rem' }} />
              </div>
              <Bone className="h-[1em] w-32 rounded-sm" style={{ fontSize: '0.875rem' }} />
            </div>
            <div className="public-feed-card-board grid items-start gap-3 md:gap-4">
              <LoadingAnnouncementCard poster />
              <LoadingAnnouncementCardCompact />
              <LoadingAnnouncementCard poster />
              <LoadingAnnouncementCardCompact />
              <LoadingAnnouncementCard poster />
              <LoadingAnnouncementCardCompact />
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
