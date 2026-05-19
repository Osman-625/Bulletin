import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { URGENCY_META } from '../../src/lib/announcements/presentation'

function source(path: string) {
  return readFileSync(path, 'utf8')
}

function token(css: string, name: string) {
  const matches = [...css.matchAll(new RegExp(`${name}:\\s*([^;]+);`, 'g'))]
  const match = matches.find((entry) => !entry[1].trim().startsWith('var('))
  if (!match) throw new Error(`Missing ${name}`)
  return match[1].trim()
}

function rgb(color: string) {
  const hex = color.match(/^#([0-9a-f]{6})$/i)
  if (hex) {
    const value = Number.parseInt(hex[1], 16)
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
  }

  const rgba = color.match(/^rgba?\(([^)]+)\)$/)
  if (rgba) {
    return rgba[1]
      .split(',')
      .slice(0, 3)
      .map((part) => Number.parseFloat(part.trim()))
  }

  throw new Error(`Unsupported color: ${color}`)
}

function alpha(color: string) {
  const rgba = color.match(/^rgba?\(([^)]+)\)$/)
  if (!rgba) return 1
  const parts = rgba[1].split(',').map((part) => Number.parseFloat(part.trim()))
  return parts[3] ?? 1
}

function blend(foreground: number[], background: number[], amount: number) {
  return foreground.map((channel, index) => channel * amount + background[index] * (1 - amount))
}

function resolveColor(value: string, css: string) {
  const normalized = String(value).trim()
  const start = normalized.indexOf('--')
  const end = normalized.indexOf(')', start)
  const varName = start >= 0 && end > start ? normalized.slice(start, end) : null
  return rgb(varName ? token(css, varName) : normalized)
}

function resolveBackground(value: string, css: string) {
  const surface = rgb(token(css, '--color-surface'))
  const normalized = String(value).trim()
  const start = normalized.indexOf('--')
  const end = normalized.indexOf(')', start)
  const varName = start >= 0 && end > start ? normalized.slice(start, end) : null
  const resolved = varName ? token(css, varName) : normalized
  const foreground = rgb(resolved)
  return blend(foreground, surface, alpha(resolved))
}

function contrastRatio(foreground: number[], background: number[]) {
  const luminance = (channels: number[]) => {
    const [r, g, b] = channels.map((channel) => {
      const value = channel / 255
      return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }

  const l1 = luminance(foreground)
  const l2 = luminance(background)
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
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
    expect(detailPage).toContain('fill')
    expect(detailPage).toContain('lg:min-h-[31rem]')
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
    expect(existsSync('src/app/(public)/loading.tsx')).toBe(true)
    expect(publicLoading).not.toContain('BrandMark')
    expect(publicLoading).not.toContain('Loading campus signal')
    expect(publicLoading).not.toContain('campus-logo-halo')
    expect(publicLoading).not.toContain('loading-signal')
    expect(publicLoading).not.toContain('float-soft')
    expect(header).toContain('size="md"')
    expect(globals).toContain('--color-mark-bg')
    expect(globals).toContain('--color-mark-plate')
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

  it('keeps audited production copy user-facing and removes internal design annotations', () => {
    const publicHome = source('src/app/(public)/page.tsx')

    expect(publicHome).not.toContain('Campus bento board')
    expect(publicHome).not.toContain('Dense campus board')
    expect(publicHome).not.toContain('Warm, bright, and campus-first')
    expect(publicHome).not.toContain('The logo scales up as the broadcast mark')
    expect(publicHome).not.toContain("padStart(2, '0')")
    expect(publicHome).toContain('Announcements')
    expect(publicHome).toContain('New today')
    expect(publicHome).toContain('Plan ahead')
  })

  it('keeps the search control reachable on mobile and preserves category filters', () => {
    const publicHome = source('src/app/(public)/page.tsx')
    const categoryFilter = source('src/components/announcements/CategoryFilter.tsx')

    expect(publicHome).toContain('mobile-search-dock')
    expect(publicHome).toContain('Search clubs, workshops, deadlines...')
    expect(publicHome).toContain('CategoryFilter categories={topics}')
    expect(categoryFilter).toContain('No topics available yet')
  })

  it('renders publisher form guardrails for uploads, scheduling, body length, and destructive actions', () => {
    const form = source('src/components/dashboard/AnnouncementForm.tsx')
    const actionBar = source('src/components/dashboard/ActionBar.tsx')

    expect(form).toContain('ANNOUNCEMENT_BODY_MAX')
    expect(form).toContain('announcement-body-count')
    expect(form).toContain('scheduled-publish-at-error')
    expect(form).toContain('role="alertdialog"')
    expect(form).toContain('organizationId')
    expect(form).toContain('supabase.auth.getUser()')
    expect(form).toContain('bannerUploadError')
    expect(actionBar).toContain('showUnpublishConfirm')
    expect(actionBar).toContain('Unpublishing will hide this announcement from the public feed.')
  })

  it('warns before idle session logout instead of silently redirecting', () => {
    const idleLogout = source('src/components/auth/IdleLogout.tsx')

    expect(idleLogout).toContain('IDLE_WARNING_MS')
    expect(idleLogout).toContain('Still there?')
    expect(idleLogout).toContain('Stay logged in')
    expect(idleLogout).toContain('aria-modal="true"')
  })

  it('keeps dashboard mobile navigation scrollable and closes it after route changes', () => {
    const shell = source('src/components/dashboard/DashboardShell.tsx')
    const sidebar = source('src/components/dashboard/DashboardSidebar.tsx')

    expect(shell).toContain('usePathname')
    expect(shell).toContain('setMobileOpen(false)')
    expect(sidebar).toContain('min-h-0')
    expect(sidebar).toContain('overflow-y-auto')
  })

  it('strengthens category filter focus and touch affordances', () => {
    const categoryFilter = source('src/components/announcements/CategoryFilter.tsx')

    expect(categoryFilter).toContain('focus-visible:ring-[var(--color-accent-inti)]')
    expect(categoryFilter).toContain('focus-visible:ring-offset-2')
    expect(categoryFilter).toContain('min-h-11')
    expect(categoryFilter).toContain('sr-only')
  })

  it('uses semantic announcement URLs and clear card actions', () => {
    const card = source('src/components/announcements/AnnouncementCard.tsx')
    const detailPage = source('src/app/(public)/announcements/[id]/page.tsx')

    expect(card).toContain('announcementPath(announcement)')
    expect(card).not.toContain('href={`/announcements/${id}`}')
    expect(card).not.toContain('>Open<')
    expect(card).toContain('Read details')
    expect(detailPage).toContain('announcementPathSegment(announcement)')
    expect(detailPage).toContain('permanentRedirect')
  })

  it('keeps announcement chips above AA contrast in the light theme', () => {
    const globals = source('src/app/globals.css')
    const card = source('src/components/announcements/AnnouncementCard.tsx')

    const important = URGENCY_META.important
    const urgent = URGENCY_META.urgent

    expect(
      contrastRatio(
        resolveColor(important.tone, globals),
        resolveBackground(important.background, globals)
      )
    ).toBeGreaterThanOrEqual(4.5)
    expect(
      contrastRatio(
        resolveColor(urgent.tone, globals),
        resolveBackground(urgent.background, globals)
      )
    ).toBeGreaterThanOrEqual(4.5)
    expect(card).toContain("color: 'var(--color-accent-hover)'")
    expect(card).toContain("color: 'var(--color-text-primary)'")
    expect(card).toContain("background: 'var(--color-deadline-surface)'")
  })

  it('keeps login and footer copy aligned with independent Bulletin branding', () => {
    const loginPage = source('src/app/(auth)/login/page.tsx')
    const footer = source('src/components/layout/Footer.tsx')
    const brandMark = source('src/components/layout/BrandMark.tsx')

    expect(loginPage).not.toContain('Authorized personnel only')
    expect(loginPage).not.toContain('Bulletin System')
    expect(loginPage).toContain('Independent campus publishing workspace')
    expect(footer).not.toContain('© {year} INTI International University')
    expect(footer).toContain('© {year} Bulletin')
    expect(brandMark).toContain('Independent campus board')
    expect(brandMark).toContain('text-[var(--color-accent-inti)]')
    expect(brandMark).toContain('text-[var(--color-text-primary)]')
  })

  it('prevents regressions to shadow-dom login forms and placeholder logo assets', () => {
    const loginPage = source('src/app/(auth)/login/page.tsx')
    const publicHome = source('src/app/(public)/page.tsx')
    const header = source('src/components/layout/Header.tsx')

    expect(loginPage).not.toMatch(/attachShadow|shadowRoot|customElements/)
    expect(publicHome).not.toMatch(/next\.svg|vercel\.svg|signal-atlas|campus-press/)
    expect(header).not.toMatch(/next\.svg|vercel\.svg|signal-atlas|campus-press/)
  })

  it('uses a desktop dense board implementation while keeping mobile-friendly card flow', () => {
    const publicHome = source('src/app/(public)/page.tsx')
    const card = source('src/components/announcements/AnnouncementCard.tsx')
    const globals = source('src/app/globals.css')

    expect(publicHome).toContain('BoardStructurePanel')
    expect(publicHome).toContain('Board order')
    expect(publicHome).toContain('hero-poster-card')
    expect(publicHome).toContain('gap-12 md:gap-14')
    expect(publicHome).toContain('New today')
    expect(publicHome).toContain('Plan ahead')
    expect(publicHome).toContain('buildAnnouncementSections')
    expect(publicHome).toContain('sectionBoardClass')
    expect(publicHome).toContain('priority-lane-board')
    expect(publicHome).toContain('dense-bento-board')
    expect(publicHome).toContain('grid gap-4 md:grid-cols-2 xl:grid-cols-3')
    expect(publicHome).toContain('dense-bento-item')
    expect(publicHome).toContain('dense-bento-section-heading')
    expect(publicHome).toContain('xl:grid-cols-3')
    expect(publicHome).toContain('data-bento-tile="featured"')
    expect(publicHome).toContain('bentoTileClass')
    expect(publicHome).toContain('dense-bento-wide')
    expect(publicHome).toContain('dense-bento-tall')
    expect(publicHome).toContain('dense-bento-compact')
    expect(publicHome).toContain('imageBentoVariant')
    expect(card).toContain('data-image-layout={visual}')
    expect(card).toContain('data-card-media={visual}')
    expect(card).toContain('featured-announcement-card')
    expect(card).toContain('aspect-[16/9] sm:aspect-[16/10]')
    expect(card).toContain('announcement-card-summary-clamp-2')
    expect(card).toContain('announcement-card-body')
    expect(card).toContain('hasBadgeRow')
    expect(globals).toContain('.announcement-card-summary-clamp')
    expect(globals).toContain('.dense-bento-board .announcement-card-body')
    expect(card).toContain("'poster' | 'letterbox' | 'stamp' | 'ribbon'")
    expect(globals).toContain('grid-auto-flow: dense')
    expect(globals).toContain('grid-auto-rows: var(--dense-bento-row)')
    expect(globals).toContain(
      '.priority-lane-board .dense-bento-item:first-child:nth-last-child(2)'
    )
    expect(globals).toContain('@media (min-width: 768px)')
    expect(globals).toContain('.dense-bento-section-heading')
    expect(globals).toContain('.hero-poster-card')
  })
})
