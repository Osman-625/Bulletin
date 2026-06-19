import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

function source(path: string) {
  return readFileSync(path, 'utf8')
}

function cssBlock(css: string, selector: string) {
  const start = css.indexOf(`${selector} {`)
  if (start === -1) throw new Error(`Missing ${selector}`)
  const end = css.indexOf('\n  }', start)
  if (end === -1) throw new Error(`Missing end for ${selector}`)
  return css.slice(start, end)
}

function remTokenValues(css: string, name: string) {
  return [...css.matchAll(new RegExp(`${name}:\\s*([0-9.]+)rem;`, 'g'))].map((match) =>
    Number(match[1])
  )
}

describe('public feed responsive adaptation source guards', () => {
  it('uses a compact public header on mobile instead of the oversized desktop masthead', () => {
    const header = source('src/components/layout/Header.tsx')

    expect(header).toContain('aria-label="Public navigation"')
    expect(header).toContain('min-h-16')
    expect(header).not.toContain('sticky top-0')
    expect(header).not.toContain('min-h-[6.25rem]')
    expect(header).not.toContain('min-h-14')
    expect(header).not.toContain('sm:min-h-28')
    expect(header).not.toContain('sm:min-h-20')
    expect(header).toContain('size="md"')
    expect(header).toContain('[&_p:last-child]:hidden')
  })

  it('keeps the mobile hero compact and defers the secondary live board until desktop width', () => {
    const publicHome = source('src/app/(public)/page.tsx')

    expect(publicHome).toContain('className="public-board-grid"')
    expect(publicHome).toContain('public-board-main-column')
    expect(publicHome).toContain('public-board-side-column')
    expect(publicHome).not.toContain('md:grid-cols-[minmax(0,1.45fr)_minmax(15rem,0.75fr)]')
    expect(publicHome).not.toContain('text-6xl leading-[0.9]')
    expect(publicHome).toContain('text-4xl leading-[0.95]')
    expect(publicHome).toContain('public-mobile-metrics')
    expect(publicHome).toContain('future-bento-cell hidden')
    expect(publicHome).toContain('lg:block')
    expect(publicHome).not.toContain('hidden gap-3 sm:grid sm:grid-cols-3')
  })

  it('keeps search and filters reachable and exposes sort controls on mobile', () => {
    const publicHome = source('src/app/(public)/page.tsx')
    const boardOrderControls = source('src/components/public/BoardOrderControls.tsx')
    const feedPendingStatus = source('src/components/public/FeedPendingStatus.tsx')
    const globals = source('src/app/globals.css')

    expect(publicHome).toContain('mobile-search-dock')
    expect(publicHome).toContain('public-board-toolbar')
    expect(publicHome).toContain('public-board-filter-inline')
    expect(publicHome.indexOf('<BoardOrderControls')).toBeGreaterThan(
      publicHome.indexOf('<PublicSearchFilters')
    )
    expect(publicHome.indexOf('<BoardOrderControls')).toBeLessThan(
      publicHome.indexOf('{featured && (')
    )
    expect(globals).toContain('.mobile-search-dock')
    expect(globals).not.toContain('.mobile-search-dock {\n    position: sticky;')
    expect(boardOrderControls).toContain('public-board-sort')
    expect(boardOrderControls).toContain('public-board-sort-bar')
    expect(boardOrderControls).toContain('Showing:')
    expect(boardOrderControls).toContain('FeedPendingStatus')
    expect(feedPendingStatus).toContain('role="status"')
    expect(feedPendingStatus).toContain('Updating notices…')
    expect(publicHome).not.toContain('public-page-reveal future-bento-cell hidden gap-4')
    expect(boardOrderControls).toContain('lg:grid-cols-[auto_minmax(0,1fr)]')
    expect(boardOrderControls).toContain('grid-cols-3')
    expect(boardOrderControls).toContain('overflow-visible')
    expect(boardOrderControls).not.toContain('grid-flow-col')
    expect(boardOrderControls).not.toContain('auto-cols-[minmax(7.75rem,1fr)]')
    expect(boardOrderControls).not.toContain('overflow-x-auto')
  })

  it('keeps route loading skeleton in the same order as the rendered public feed', () => {
    const loading = source('src/app/(public)/loading.tsx')

    expect(loading.indexOf('Search + category filters')).toBeGreaterThan(loading.indexOf('Hero'))
    expect(loading.indexOf('Sort / order controls')).toBeGreaterThan(
      loading.indexOf('Search + category filters')
    )
    expect(loading.indexOf('Featured + pinned notices')).toBeGreaterThan(
      loading.indexOf('Sort / order controls')
    )
    expect(loading.indexOf('Feed')).toBeGreaterThan(loading.indexOf('Featured + pinned notices'))
  })

  it('uses clear copy for filtered views where every matching notice is featured above the feed', () => {
    const publicHome = source('src/app/(public)/page.tsx')

    expect(publicHome).toContain('All matching notices are shown above.')
    expect(publicHome).not.toContain('No more notices match this view.')
  })

  it('renders a distinct public feed load error instead of presenting query failures as empty boards', () => {
    const publicHome = source('src/app/(public)/page.tsx')
    const data = source('src/infrastructure/database/data.ts')

    expect(data).toContain('error: string | null')
    expect(data).toContain("error: 'public_announcements_query_failed'")
    expect(publicHome).toContain('PublicFeedLoadError')
    expect(publicHome).toContain('Bulletin could not load notices')
    expect(publicHome).toContain('Try again')
  })

  it('keeps public board density compact without changing the board structure', () => {
    const publicHome = source('src/app/(public)/page.tsx')
    const pinnedNoticesPanel = source('src/components/public/PinnedNoticesPanel.tsx')
    const boardOrderControls = source('src/components/public/BoardOrderControls.tsx')
    const card = source('src/components/announcements/AnnouncementCard.tsx')
    const globals = source('src/app/globals.css')

    expect(publicHome).toContain('public-board-hero--compact')
    expect(publicHome).toContain('public-board-toolbar')
    expect(publicHome).toContain('public-board-filter-inline')
    expect(publicHome).toContain('public-featured-compact')
    expect(publicHome).toContain('public-featured-grid')
    expect(publicHome).toContain('public-featured-grid public-board-grid')
    expect(publicHome).toContain('future-kicker public-board-span-full')
    expect(publicHome).toContain('public-featured-compact public-board-main-column')
    expect(publicHome).not.toContain('lg:pb-[1.55rem]')
    expect(publicHome).not.toContain('lg:grid-cols-[minmax(0,1.18fr)_minmax(18rem,0.8fr)]')
    expect(publicHome).toContain('public-feed-card-board grid gap-3 md:gap-4')
    expect(publicHome).not.toContain('public-board-control-card future-bento-cell')
    expect(pinnedNoticesPanel).toContain('min-h-[5.6rem]')
    expect(pinnedNoticesPanel).toContain('lg:h-full')
    expect(pinnedNoticesPanel).toContain('lg:auto-rows-fr')
    expect(pinnedNoticesPanel).toContain('public-board-side-column')
    expect(pinnedNoticesPanel).toContain('overflow-visible')
    expect(pinnedNoticesPanel).not.toContain('lg:mt-[1.55rem]')
    expect(pinnedNoticesPanel).not.toContain('overflow-x-auto')
    expect(pinnedNoticesPanel).toContain('lg:justify-center')
    expect(boardOrderControls).toContain('public-board-sort-bar')
    expect(boardOrderControls).toContain('p-1.5')
    expect(boardOrderControls).toContain('sm:p-2')
    expect(boardOrderControls).not.toContain('gap-3 rounded-[1.05rem] p-3')
    expect(card).toContain('lg:aspect-[16/6]')
    expect(card).toContain('1.5rem')
    expect(card).toContain("fit = 'cover'")
    expect(card).toContain("fit === 'contain'")
    expect(card).toContain('style={{ objectFit: fit }}')
    expect(card).toContain('featured-announcement-media-frame')
    expect(card).toContain('featured-announcement-image-window')
    expect(card).toContain('featured-announcement-corner')
    expect(card).toContain('fit="cover"')
    expect(globals).toContain('.public-featured-compact [data-card-media]')
    expect(globals).toContain(".public-featured-compact [data-testid='announcement-card']")
    expect(globals).toContain('.featured-announcement-media-frame')
    expect(globals).toContain('.featured-announcement-image-window')
    expect(globals).toContain('.featured-announcement-corner')
    expect(globals).toContain('clip-path: polygon(100% 0, 100% 100%, 0 0)')
    expect(globals).toContain('height: 100%')
    expect(globals).toContain('block-size: clamp(10.5rem, 18vw, 12.5rem)')
    expect(globals).toContain('object-position: center')
    expect(globals).toContain('.public-board-sort-bar nav')
  })

  it('keeps secondary live-board chrome off narrow screens and strengthens urgent cards through CSS', () => {
    const publicHome = source('src/app/(public)/page.tsx')
    const globals = source('src/app/globals.css')

    expect(publicHome).toContain('public-board-live-panel')
    expect(publicHome).toContain(
      'public-board-live-panel public-board-side-column public-page-reveal future-bento-cell hidden'
    )
    expect(publicHome).toContain('lg:block')
    expect(publicHome).not.toContain('md:block')
    expect(publicHome).not.toContain('border-l-4')
    expect(publicHome).toContain('urgent-bento-item')
    expect(globals).toContain(".urgent-bento-item [data-testid='announcement-card']")
    expect(globals).toContain('urgent-bento-corner')
    expect(globals).not.toContain('width: 3px')
  })

  it('uses separate uniform rhythms for image and no-image announcement cards', () => {
    const publicHome = source('src/app/(public)/page.tsx')
    const card = source('src/components/announcements/AnnouncementCard.tsx')
    const globals = source('src/app/globals.css')

    expect(publicHome).toContain('uniform-card-board')
    expect(publicHome).toContain('bentoTileClass(announcement)')
    expect(publicHome).toContain('card-with-image')
    expect(publicHome).toContain('card-without-image')
    expect(publicHome).not.toContain("classes.push('dense-bento-tall')")
    expect(publicHome).not.toContain("classes.push('dense-bento-compact')")
    expect(publicHome).not.toContain('const variants: AnnouncementCardVisual[]')
    expect(card).toContain('{imageUrl && (')
    expect(card).not.toContain('announcement-card-fallback')
    expect(card).toContain('data-uniform-card="true"')
    expect(card).toContain(
      'announcement-card-media relative overflow-hidden rounded-t-[1.15rem] border-b'
    )
    expect(card).not.toContain('relative aspect-[16/9] flex-shrink-0')
    expect(card).not.toContain('min-h-[26rem]')
    expect(card).not.toContain('min-h-[18rem]')
    expect(globals).toContain('.uniform-card-board')
    expect(globals).toContain('.uniform-card-board > .card-with-image')
    expect(globals).toContain('.uniform-card-board > .card-without-image')
    expect(globals).toContain('--public-board-row')
    expect(globals).toContain('--public-board-image-span')
    expect(globals).toContain('--public-board-text-span')
    expect(globals).toContain('--public-board-image-span: 8')
    expect(globals).toContain('--public-board-text-span: 5')
    expect(remTokenValues(globals, '--public-card-media-height').length).toBeGreaterThan(0)
    expect(
      remTokenValues(globals, '--public-card-media-height').every((value) => value >= 16)
    ).toBe(true)
    expect(cssBlock(globals, '.uniform-card-board')).toContain(
      'grid-auto-rows: var(--public-board-row)'
    )
    expect(cssBlock(globals, '.uniform-card-board')).toContain('grid-auto-flow: row dense')
    expect(cssBlock(globals, '.uniform-card-board')).toContain('align-items: stretch')
    expect(cssBlock(globals, '.uniform-card-board > .card-with-image')).toContain(
      'grid-row: span var(--public-board-image-span)'
    )
    expect(cssBlock(globals, '.uniform-card-board > .card-without-image')).toContain(
      'grid-row: span var(--public-board-text-span)'
    )
    expect(cssBlock(globals, ".uniform-card-board [data-testid='announcement-card']")).toContain(
      'height: 100%'
    )
    expect(
      cssBlock(globals, ".uniform-card-board [data-testid='announcement-card']")
    ).not.toContain('height: auto')
    expect(globals).toContain('--dense-bento-row: 16rem')
    expect(globals).toContain('.public-feed-card-board')
    expect(globals).toContain('.dense-bento-board .card-with-image')
    expect(globals).toContain('.dense-bento-board .card-without-image')
    expect(globals).toContain('.priority-lane-board.uniform-card-board .dense-bento-item')
    expect(globals).toContain('grid-column: auto')
    expect(globals).toContain('object-fit: cover')
    expect(globals).toContain('object-position: center')
    expect(globals).toContain('grid-template-columns: minmax(0, 1fr)')
    expect(globals).toContain('grid-template-columns: repeat(2, minmax(0, 1fr))')
    expect(globals).toContain('grid-template-columns: repeat(3, minmax(0, 1fr))')
    expect(globals).not.toContain('repeat(auto-fit')
    expect(globals).not.toContain('repeat(auto-fill')
    expect(card).toContain('toSafeImageUrl(banner_url)')
    expect(card).toContain('object-cover object-center')
    expect(globals).not.toContain('.priority-lane-board .dense-bento-item:only-child')
    expect(globals).not.toContain(
      '.priority-lane-board .dense-bento-item:first-child:nth-last-child(2)'
    )
    expect(globals).not.toContain("[data-uniform-card='true'] {\n    min-height: 24rem;")
    expect(globals).not.toContain('.dense-bento-board .dense-bento-tall')
  })

  it('keeps image cards tall enough for readable descriptions instead of letting media crush text', () => {
    const card = source('src/components/announcements/AnnouncementCard.tsx')
    const globals = source('src/app/globals.css')

    expect(card).toContain('<article')
    expect(card).toContain('announcement-card')
    expect(card).toContain('announcement-card-media')
    expect(card).toContain('announcement-card-image')
    expect(card).toContain('announcement-card-body')
    expect(card).toContain('announcement-card-main')
    expect(card).toContain('announcement-card-title')
    expect(card).toContain('announcement-card-summary')
    expect(card).toContain('announcement-card-meta')
    expect(card).toContain('announcement-card-footer')
    expect(card.indexOf('announcement-card-footer')).toBeGreaterThan(
      card.indexOf('announcement-card-summary')
    )
    expect(globals).toContain('.announcement-card {')
    expect(cssBlock(globals, '.announcement-card')).toContain(
      'grid-template-rows: auto minmax(0, 1fr)'
    )
    expect(globals).toContain('.uniform-card-board .card-with-image .announcement-card-summary')
    expect(globals).toContain('.uniform-card-board .card-without-image .announcement-card-summary')
    expect(globals).toContain('-webkit-line-clamp: 3')
    expect(
      cssBlock(globals, '.uniform-card-board .card-with-image .announcement-card-summary')
    ).toContain('min-height: 3em')
    expect(
      cssBlock(globals, '.uniform-card-board .card-without-image .announcement-card-summary')
    ).toContain('min-height: 6em')
    expect(globals).toContain('.dense-bento-board .card-with-image [data-card-media]')
    expect(globals).toContain('block-size: var(--public-card-media-height)')
    expect(globals).toContain('padding: 20px')
    expect(globals).toContain('line-height: 1.5')
    expect(globals).not.toContain('min-height: 0rem')
  })
})
