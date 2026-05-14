import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

function source(path: string) {
  return readFileSync(path, 'utf8')
}

describe('Future Commons production UI guards', () => {
  it('uses a sliding switch for theme control', () => {
    const themeToggle = source('src/components/layout/ThemeToggle.tsx')

    expect(themeToggle).toContain('role="switch"')
    expect(themeToggle).toContain('aria-checked')
    expect(themeToggle).toContain('data-testid="theme-switch-knob"')
    expect(themeToggle).toContain('translate-x')
  })

  it('keeps auth screens navigable with a reusable back control', () => {
    const loginPage = source('src/app/(auth)/login/page.tsx')

    expect(loginPage).toContain('BackNavButton')
    expect(loginPage).toContain('aria-label="Go back"')
  })

  it('removes decorative blue line artifacts from Future Commons surfaces', () => {
    const globals = source('src/app/globals.css')
    const publicHome = source('src/app/(public)/page.tsx')
    const loginPage = source('src/app/(auth)/login/page.tsx')

    expect(globals).not.toContain('commons-image-fallback::after')
    expect(publicHome).not.toContain('rotate-[-14deg]')
    expect(loginPage).not.toContain('rotate-[-15deg]')
  })

  it('treats announcement visuals as posters that are never cropped', () => {
    const detailPage = source('src/app/(public)/announcements/[id]/page.tsx')
    const card = source('src/components/announcements/AnnouncementCard.tsx')

    expect(detailPage).toContain('data-testid="announcement-poster-image"')
    expect(detailPage).toContain('object-contain')
    expect(detailPage).toContain('Open original announcement image')
    expect(detailPage).toContain('width={1800}')
    expect(card).toContain('object-contain')
    expect(card).not.toContain('object-cover')
  })

  it('surfaces the Future Commons public brand system with visible logo motion', () => {
    const publicHome = source('src/app/(public)/page.tsx')
    const publicLoading = source('src/app/(public)/loading.tsx')
    const header = source('src/components/layout/Header.tsx')
    const globals = source('src/app/globals.css')

    expect(publicHome).toContain('Campus Bulletin')
    expect(publicHome).toContain('campus-logo-halo')
    expect(publicHome).toContain('future-warm-plane')
    expect(publicLoading).toContain('Loading campus signal')
    expect(header).toContain('size="xl"')
    expect(globals).toContain('--color-mark-bg')
    expect(globals).toContain('@keyframes signal-ring')
  })

  it('adds board-order sorting without replacing category filters', () => {
    const publicHome = source('src/app/(public)/page.tsx')
    const categoryFilter = source('src/components/announcements/CategoryFilter.tsx')
    const card = source('src/components/announcements/AnnouncementCard.tsx')

    expect(publicHome).toContain("const BOARD_SORTS = ['priority', 'issued', 'closing']")
    expect(publicHome).toContain('BoardOrderControls')
    expect(publicHome).toContain('buildFeedHref({ category, q: search, sort: option.sort })')
    expect(publicHome).toContain('sortAnnouncementsForPublicBoard')
    expect(categoryFilter).toContain('new URLSearchParams(searchParams.toString())')
    expect(card).toContain('EventMetaPill')
    expect(card).toContain('Deadline')
  })

  it('uses a desktop packed poster board while keeping mobile-friendly card flow', () => {
    const publicHome = source('src/app/(public)/page.tsx')
    const card = source('src/components/announcements/AnnouncementCard.tsx')
    const globals = source('src/app/globals.css')

    expect(publicHome).toContain('Packed poster board')
    expect(publicHome).toContain('Pinned hero')
    expect(publicHome).toContain('BoardStructurePanel')
    expect(publicHome).toContain('Board order')
    expect(publicHome).toContain('hero-poster-card')
    expect(publicHome).toContain('Daily issues')
    expect(publicHome).toContain('Future events')
    expect(publicHome).toContain('buildAnnouncementSections')
    expect(publicHome).toContain('sectionBoardClass')
    expect(publicHome).toContain('compact-lane-board')
    expect(publicHome).toContain('packed-poster-board')
    expect(publicHome).toContain('grid gap-4 md:grid-cols-2 xl:grid-cols-3')
    expect(publicHome).toContain('packed-poster-item')
    expect(publicHome).toContain('packed-poster-section-heading')
    expect(publicHome).toContain('xl:grid-cols-3')
    expect(publicHome).toContain('data-bento-tile="featured"')
    expect(publicHome).toContain('bentoTileClass')
    expect(publicHome).toContain('imageBentoVariant')
    expect(card).toContain('data-image-layout={visual}')
    expect(card).toContain('data-card-media={visual}')
    expect(card).toContain("'poster' | 'letterbox' | 'stamp' | 'ribbon'")
    expect(globals).toContain('column-count: 3')
    expect(globals).toContain('@media (min-width: 768px)')
    expect(globals).toContain('.packed-poster-section-heading')
    expect(globals).toContain('.hero-poster-card')
  })
})
