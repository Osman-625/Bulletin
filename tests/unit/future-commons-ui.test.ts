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

  it('uses a safe shared back control for internal detail and editor routes', () => {
    const backNav = source('src/components/navigation/BackNavButton.tsx')
    const publicBack = source('src/components/announcements/BackButton.tsx')
    const reviewPage = source('src/app/(admin)/admin/review/[id]/page.tsx')
    const announcementForm = source('src/components/dashboard/AnnouncementForm.tsx')
    const editPage = source('src/app/(dashboard)/dashboard/announcements/[id]/edit/page.tsx')
    const newOrgPage = source('src/app/(admin)/admin/orgs/new/page.tsx')
    const invitePublisherPage = source('src/app/(admin)/admin/publishers/invite/page.tsx')
    const inviteAdminPage = source('src/app/(super-admin)/super-admin/admins/invite/page.tsx')
    const ownerResourcesPage = source('src/app/(owner)/owner/resources/page.tsx')

    expect(backNav).toContain('document.referrer')
    expect(backNav).toContain('window.location.origin')
    expect(backNav).toContain('window.history.state')
    expect(backNav).toContain('state.idx')
    expect(backNav).toContain('resolvedAriaLabel')
    expect(backNav).toContain("children ? undefined : 'Go back'")
    expect(backNav).toContain('router.push(fallbackHref)')
    expect(publicBack).toContain('BackNavButton')
    expect(publicBack).toContain('fallbackHref="/"')
    expect(reviewPage).toContain('BackNavButton')
    expect(reviewPage).toContain('fallbackHref="/admin/review"')
    expect(announcementForm).toContain('BackNavButton')
    expect(announcementForm).toContain('backHref?: string')
    expect(announcementForm).toContain('fallbackHref={backHref}')
    expect(announcementForm).not.toContain("router.push('/dashboard/announcements')")
    expect(editPage).toContain('backHref="/dashboard/announcements"')
    expect(newOrgPage).toContain('BackNavButton')
    expect(newOrgPage).toContain('fallbackHref="/admin/orgs"')
    expect(invitePublisherPage).toContain('BackNavButton')
    expect(invitePublisherPage).toContain('fallbackHref="/admin/publishers"')
    expect(inviteAdminPage).toContain('BackNavButton')
    expect(inviteAdminPage).toContain('fallbackHref="/super-admin/admins"')
    expect(ownerResourcesPage).toContain('BackNavButton')
    expect(ownerResourcesPage).toContain('fallbackHref="/owner/analytics"')
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
    expect(token(globals, '--color-focus')).toMatch(/^#/)
    expect(globals).toContain('@keyframes signal-ring')
  })

  it('adds board-order sorting without replacing category filters', () => {
    const publicHome = source('src/app/(public)/page.tsx')
    const publicBoard = source('src/lib/announcements/public-board.ts')
    const categoryFilter = source('src/components/announcements/CategoryFilter.tsx')
    const card = source('src/components/announcements/AnnouncementCard.tsx')

    expect(publicBoard).toContain("export const BOARD_SORTS = ['priority', 'issued', 'closing']")
    expect(publicHome).toContain('@/lib/announcements/public-board')
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
    expect(form).toContain('deleteConfirmRef')
    expect(form).toContain('deleteCancelRef')
    expect(form).toContain('handleDeleteConfirmKeyDown')
    expect(form).toContain("event.key === 'Escape'")
    expect(form).toContain("event.key === 'Tab'")
    expect(form).toContain('querySelectorAll<HTMLElement>')
    expect(form).toContain('aria-modal="true"')
    expect(form).toContain('onKeyDown={handleDeleteConfirmKeyDown}')
    expect(actionBar).toContain('showUnpublishConfirm')
    expect(actionBar).toContain('Unpublishing will hide this announcement from the public feed.')
    expect(actionBar).toContain('unpublishConfirmRef')
    expect(actionBar).toContain('unpublishCancelRef')
    expect(actionBar).toContain('handleUnpublishConfirmKeyDown')
    expect(actionBar).toContain("event.key === 'Escape'")
    expect(actionBar).toContain("event.key === 'Tab'")
    expect(actionBar).toContain('querySelectorAll<HTMLElement>')
    expect(actionBar).toContain('aria-modal="true"')
    expect(actionBar).toContain('onKeyDown={handleUnpublishConfirmKeyDown}')
  })

  it('warns before idle session logout instead of silently redirecting', () => {
    const idleLogout = source('src/components/auth/IdleLogout.tsx')

    expect(idleLogout).toContain('IDLE_WARNING_MS')
    expect(idleLogout).toContain('Still there?')
    expect(idleLogout).toContain('Stay logged in')
    expect(idleLogout).toContain('aria-modal="true"')
    expect(idleLogout).toContain('dialogRef')
    expect(idleLogout).toContain('stayButtonRef')
    expect(idleLogout).toContain('previousFocusedElementRef')
    expect(idleLogout).toContain('handleDialogKeyDown')
    expect(idleLogout).toContain("event.key === 'Escape'")
    expect(idleLogout).toContain("event.key === 'Tab'")
    expect(idleLogout).toContain('querySelectorAll<HTMLElement>')
  })

  it('keeps dashboard mobile navigation scrollable and closes it after route changes', () => {
    const shell = source('src/components/dashboard/DashboardShell.tsx')
    const sidebar = source('src/components/dashboard/DashboardSidebar.tsx')

    expect(shell).toContain('usePathname')
    expect(shell).toContain('setMobileOpen(false)')
    expect(sidebar).toContain('min-h-0')
    expect(sidebar).toContain('overflow-y-auto')
    expect(sidebar).toContain('mobileDialogRef')
    expect(sidebar).toContain('firstMobileFocusRef')
    expect(sidebar).toContain('previousFocusedElementRef')
    expect(sidebar).toContain('handleMobileDialogKeyDown')
    expect(sidebar).toContain("event.key === 'Escape'")
    expect(sidebar).toContain("event.key === 'Tab'")
    expect(sidebar).toContain('querySelectorAll<HTMLElement>')
    expect(sidebar).toContain('onKeyDown={handleMobileDialogKeyDown}')
  })

  it('focus-traps super-admin reset password modal and supports Escape close', () => {
    const resetButton = source('src/app/(super-admin)/super-admin/users/_ResetButton.tsx')

    expect(resetButton).toContain('dialogRef')
    expect(resetButton).toContain('firstFocusRef')
    expect(resetButton).toContain('previousFocusedElementRef')
    expect(resetButton).toContain('handleDialogKeyDown')
    expect(resetButton).toContain("event.key === 'Escape'")
    expect(resetButton).toContain("event.key === 'Tab'")
    expect(resetButton).toContain('querySelectorAll<HTMLElement>')
    expect(resetButton).toContain('aria-modal="true"')
    expect(resetButton).toContain('role="dialog"')
    expect(resetButton).toContain('onKeyDown={handleDialogKeyDown}')
  })

  it('renders explicit empty states for category management pages', () => {
    const adminCategories = source('src/app/(admin)/admin/categories/page.tsx')
    const superAdminCategories = source('src/app/(super-admin)/super-admin/categories/page.tsx')
    const ownerCategories = source('src/app/(owner)/owner/categories/page.tsx')

    expect(adminCategories).toContain('No categories yet')
    expect(adminCategories).toContain('Create the first category')
    expect(adminCategories).toContain('role="status"')
    expect(superAdminCategories).toContain('No categories yet')
    expect(superAdminCategories).toContain('Create a category to start organizing')
    expect(superAdminCategories).toContain('role="status"')
    expect(ownerCategories).toContain('No categories yet')
    expect(ownerCategories).toContain('Create a category to start organizing')
    expect(ownerCategories).toContain('role="status"')
  })

  it('uses design tokens for category color fallbacks in admin surfaces', () => {
    const adminCategories = source('src/app/(admin)/admin/categories/page.tsx')
    const superAdminCategories = source('src/app/(super-admin)/super-admin/categories/page.tsx')
    const ownerCategories = source('src/app/(owner)/owner/categories/page.tsx')

    for (const page of [adminCategories, superAdminCategories, ownerCategories]) {
      expect(page).toContain('DEFAULT_CATEGORY_COLOR')
      expect(page).toContain('cat.color ?? DEFAULT_CATEGORY_COLOR')
      expect(page).not.toContain("cat.color ?? '#C8102E'")
    }
  })

  it('uses a shared display token for category fallbacks outside color inputs', () => {
    const displaySurfaces = [
      source('src/components/announcements/CategoryFilter.tsx'),
      source('src/components/announcements/AnnouncementCard.tsx'),
      source('src/app/(public)/announcements/[id]/page.tsx'),
      source('src/app/(admin)/admin/review/[id]/page.tsx'),
      source('src/app/(admin)/admin/analytics/page.tsx'),
      source('src/app/(owner)/owner/analytics/page.tsx'),
      source('src/lib/owner/resources.ts'),
    ]

    for (const file of displaySurfaces) {
      expect(file).toContain('DEFAULT_CATEGORY_DISPLAY_COLOR')
      expect(file).not.toContain("?? '#C8102E'")
    }
  })

  it('renders an explicit empty state for super-admin admin management', () => {
    const superAdminAdmins = source('src/app/(super-admin)/super-admin/admins/page.tsx')

    expect(superAdminAdmins).toContain('No admins yet')
    expect(superAdminAdmins).toContain('Invite the first admin')
    expect(superAdminAdmins).toContain('role="status"')
    expect(superAdminAdmins).toContain('rounded-full')
    expect(superAdminAdmins).toContain('text-xs')
    expect(superAdminAdmins).toContain('bg-[var(--color-role-super-admin-bg)]')
    expect(superAdminAdmins).toContain('text-[var(--color-role-super-admin-text)]')
  })

  it('renders explicit empty states for admin organization and publisher management', () => {
    const adminOrgs = source('src/app/(admin)/admin/orgs/page.tsx')
    const adminPublishers = source('src/app/(admin)/admin/publishers/page.tsx')

    expect(adminOrgs).toContain('No organizations yet')
    expect(adminOrgs).toContain('Create the first organization')
    expect(adminOrgs).toContain('role="status"')
    expect(adminPublishers).toContain('No publishers yet')
    expect(adminPublishers).toContain('Invite the first publisher')
    expect(adminPublishers).toContain('role="status"')
  })

  it('prevents publisher invites from submitting when no approved organization exists', () => {
    const invitePublisherPage = source('src/app/(admin)/admin/publishers/invite/page.tsx')

    expect(invitePublisherPage).toContain('const canInvitePublisher = approvedOrgs.length > 0')
    expect(invitePublisherPage).toContain('id="publisher-invite-org-help"')
    expect(invitePublisherPage).toContain('aria-describedby="publisher-invite-org-help"')
    expect(invitePublisherPage).toContain('disabled={!canInvitePublisher}')
    expect(invitePublisherPage).toContain(
      'Create an approved organization before inviting publishers'
    )
  })

  it('renders explicit empty states for analytics sections that have no rows', () => {
    const adminAnalytics = source('src/app/(admin)/admin/analytics/page.tsx')
    const superAdminAnalytics = source('src/app/(super-admin)/super-admin/analytics/page.tsx')
    const ownerAnalytics = source('src/app/(owner)/owner/analytics/page.tsx')

    expect(adminAnalytics).toContain('No published categories yet')
    expect(adminAnalytics).toContain('No recent publications yet')
    expect(adminAnalytics).toContain('role="status"')
    expect(superAdminAnalytics).toContain('No organization activity yet')
    expect(superAdminAnalytics).toContain('No recent users yet')
    expect(superAdminAnalytics).toContain('role="status"')
    expect(ownerAnalytics).toContain('No organization activity yet')
    expect(ownerAnalytics).toContain('No published categories yet')
    expect(ownerAnalytics).toContain('No recent users yet')
    expect(ownerAnalytics).toContain('role="status"')
  })

  it('keeps owner overview and resources mobile-friendly with explicit no-data states', () => {
    const ownerHome = source('src/app/(owner)/owner/page.tsx')
    const ownerResources = source('src/app/(owner)/owner/resources/page.tsx')

    expect(ownerHome).toContain('sm:col-span-4')
    expect(ownerHome).toContain('sm:grid-cols-2')
    expect(ownerHome).toContain('getOwnerResourceOverview')
    expect(ownerHome).toContain('Total Views')
    expect(ownerHome).toContain('Published Views')
    expect(ownerHome).toContain('Average Views')
    expect(ownerHome).toContain('Registration Links')
    expect(ownerHome).toContain('Banner Storage')
    expect(ownerHome).toContain('System Health')
    expect(ownerHome).toContain('Top Viewed Announcements')
    expect(ownerHome).toContain('Views by Category')
    expect(ownerHome).toContain('Views by Organization')
    expect(ownerHome).toContain('No audit activity yet')
    expect(ownerHome).toContain('No tracked announcement views yet')
    expect(ownerHome).toContain('No view distribution yet')
    expect(ownerHome).toContain('role="status"')
    expect(ownerResources).toContain('No tracked announcement views yet')
    expect(ownerResources).toContain('No view distribution yet')
    expect(ownerResources).toContain('role="status"')
  })

  it('renders explicit empty states for user management pages', () => {
    const adminUsers = source('src/app/(admin)/admin/users/page.tsx')
    const superAdminUsers = source('src/app/(super-admin)/super-admin/users/page.tsx')
    const ownerUsers = source('src/app/(owner)/owner/users/page.tsx')

    expect(adminUsers).toContain('No users match this view')
    expect(adminUsers).toContain('Clear the role filter')
    expect(superAdminUsers).toContain('No users match this view')
    expect(superAdminUsers).toContain('Clear the role filter')
    expect(ownerUsers).toContain('No users match this view')
    expect(ownerUsers).toContain('Clear the role filter')
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
    expect(existsSync('public/next.svg')).toBe(false)
    expect(existsSync('public/vercel.svg')).toBe(false)
    expect(existsSync('public/file.svg')).toBe(false)
    expect(existsSync('public/globe.svg')).toBe(false)
    expect(existsSync('public/window.svg')).toBe(false)
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
