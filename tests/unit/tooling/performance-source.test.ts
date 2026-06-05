import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

function source(path: string) {
  return readFileSync(path, 'utf8')
}

describe('performance source guards', () => {
  it('paginates public announcements at the Supabase query boundary', () => {
    const data = source('src/lib/data.ts')
    const publicPage = source('src/app/(public)/page.tsx')

    expect(data).toContain('PUBLIC_FEED_PAGE_SIZE')
    expect(data).toContain("count: 'exact'")
    expect(data).toContain('.range(from, to)')
    expect(publicPage).toContain('page?: string')
    expect(publicPage).toContain('announcementPage.items')
    expect(publicPage).toContain('FeedPagination')
  })

  it('paginates dashboard announcements with server-side tab and search filters', () => {
    const dashboard = source('src/app/(dashboard)/dashboard/announcements/page.tsx')
    const dashboardClient = source('src/components/dashboard/AnnouncementsClient.tsx')

    expect(dashboard).toContain('DASHBOARD_ANNOUNCEMENTS_PAGE_SIZE')
    expect(dashboard).toContain('tab?: string')
    expect(dashboard).toContain('page?: string')
    expect(dashboard).toContain('normalizedSearch')
    expect(dashboard).toContain('.range(from, to)')
    expect(dashboard).not.toContain('DASHBOARD_ANNOUNCEMENTS_LIMIT')
    expect(dashboardClient).toContain('dashboardAnnouncementsHref')
    expect(dashboardClient).not.toContain('useState')
    expect(dashboardClient).not.toContain('filtered.slice')
  })

  it('paginates admin, owner, and super-admin user management at the Supabase query boundary', () => {
    const data = source('src/lib/data.ts')
    const adminUsers = source('src/app/(admin)/admin/users/page.tsx')
    const ownerUsers = source('src/app/(owner)/owner/users/page.tsx')
    const superAdminUsers = source('src/app/(super-admin)/super-admin/users/page.tsx')

    expect(data).toContain('USER_MANAGEMENT_PAGE_SIZE')
    expect(data).toContain('getVisibleUsersForAdminPage')
    expect(data).toContain('organization_members!inner')
    expect(data).toContain('.range(from, to)')
    expect(adminUsers).toContain('page?: string')
    expect(adminUsers).toContain('visibleUsersPage.items')
    expect(adminUsers).toContain('UserPagination')
    expect(ownerUsers).toContain('OWNER_USERS_PAGE_SIZE')
    expect(ownerUsers).toContain("select('*', { count: 'exact' })")
    expect(ownerUsers).toContain('.range(from, to)')
    expect(ownerUsers).toContain('UserPagination')
    expect(superAdminUsers).toContain('SUPER_ADMIN_USERS_PAGE_SIZE')
    expect(superAdminUsers).toContain("select('*', { count: 'exact' })")
    expect(superAdminUsers).toContain('.range(from, to)')
    expect(superAdminUsers).toContain('UserPagination')
  })

  it('keeps the internal brand lab out of public discovery', () => {
    const robots = source('src/app/robots.ts')
    const brandLab = source('src/app/brand-lab/page.tsx')
    const sitemap = source('src/app/sitemap.ts')

    expect(robots).toContain("'/brand-lab'")
    expect(robots).toContain("'/login'")
    expect(robots).toContain("'/register'")
    expect(robots).toContain("'/change-password'")
    expect(sitemap).not.toContain('`${siteUrl}/login`')
    expect(brandLab).toContain('robots:')
    expect(brandLab).toContain('index: false')
    expect(brandLab).toContain('follow: false')
  })

  it('adds conservative cache headers without caching nonce-protected HTML', () => {
    const config = source('next.config.ts')

    expect(config).toContain('poweredByHeader: false')
    expect(config).toContain('PUBLIC_STATIC_CACHE_CONTROL')
    expect(config).toContain("source: '/robots.txt'")
    expect(config).toContain("source: '/sitemap.xml'")
    expect(config).toContain("source: '/opengraph-image'")
    expect(config).toContain('s-maxage=3600')
    expect(config).toContain('stale-while-revalidate=86400')
    expect(config).not.toContain("source: '/'")
    expect(config).not.toContain("source: '/dashboard")
  })
})
