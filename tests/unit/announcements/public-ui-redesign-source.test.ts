import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

function source(path: string) {
  return readFileSync(path, 'utf8')
}

function bodyRule(css: string) {
  const match = css.match(/body\s*\{([\s\S]*?)\n\s*\}/)
  if (!match) throw new Error('Missing body rule')
  return match[1]
}

describe('optimized public UI redesign source guards', () => {
  it('keeps the public background texture route-scoped instead of on the global body', () => {
    const globals = source('src/app/globals.css')

    expect(bodyRule(globals)).not.toContain('24px 24px')
    expect(globals).toContain('.future-warm-plane')
    expect(globals).toContain('.dark .future-warm-plane')
    expect(globals).toContain('@media (max-width: 767px)')
  })

  it('uses a monotonic display type scale', () => {
    const globals = source('src/app/globals.css')

    expect(globals).toContain('--text-5xl: 3rem')
    expect(globals).toContain('--text-6xl: 3.5rem')
    expect(globals).toContain('--text-7xl: 4rem')
    expect(globals).toContain('--text-8xl: 4.75rem')
  })

  it('surfaces mobile metrics and sort controls instead of hiding board context below desktop', () => {
    const publicHome = source('src/app/(public)/page.tsx')
    const boardOrderControls = source('src/components/public/BoardOrderControls.tsx')

    expect(publicHome).toContain('public-mobile-metrics')
    expect(boardOrderControls).toContain('public-board-sort')
    expect(publicHome).not.toContain('hidden gap-3 sm:grid sm:grid-cols-3')
    expect(publicHome).not.toContain('public-page-reveal future-bento-cell hidden gap-4')
  })

  it('keeps the featured notice and pagination visually distinct on every breakpoint', () => {
    const publicHome = source('src/app/(public)/page.tsx')
    const feedPagination = source('src/components/public/FeedPagination.tsx')
    const card = source('src/components/announcements/AnnouncementCard.tsx')
    const globals = source('src/app/globals.css')

    expect(publicHome).toContain('featureLabel={featuredIsPinned ?')
    expect(card).toContain('featured-announcement-badge')
    expect(globals).toContain('.featured-announcement-badge')
    expect(feedPagination).toContain('pagination-progress')
    expect(feedPagination).toContain('aria-label="Pagination progress"')
    expect(feedPagination).toContain('Load more notices')
  })

  it('adds a skip link and public Open Graph metadata without changing the theme provider contract', () => {
    const layout = source('src/app/layout.tsx')
    const providers = source('src/app/providers.tsx')

    expect(layout).toContain('href="#main-content"')
    expect(layout).toContain('openGraph')
    expect(layout).toContain('twitter')
    expect(providers).toContain('ThemeProvider attribute="class"')
  })
})
