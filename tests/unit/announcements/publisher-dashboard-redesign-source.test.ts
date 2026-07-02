import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

function source(path: string) {
  return readFileSync(path, 'utf8')
}

describe('dashboard board redesign source guards', () => {
  it('uses the compact board base for the publisher overview', () => {
    const page = source('src/app/(dashboard)/dashboard/page.tsx')
    const shared = source('src/components/dashboard/DashboardBoard.tsx')
    const css = source('src/app/globals.css')

    expect(page).toContain('publisher-dashboard-shell')
    expect(page).toContain('DashboardBoardHeader')
    expect(page).toContain('DashboardBoardMetrics')
    expect(page).toContain('DashboardBoardBoard')
    expect(page).toContain('Your announcements')
    expect(page).toContain('Needs attention')
    expect(page).toContain('New announcement')
    expect(page).not.toContain('pub-mast-title')
    expect(page).not.toContain('pub-ledger')
    expect(page).not.toContain('pub-wire')

    expect(shared).toContain('DashboardBoardHeader')
    expect(shared).toContain('DashboardBoardMetrics')
    expect(shared).toContain('DashboardBoardRow')
    expect(css).toContain('.board-header')
    expect(css).toContain('.board-metrics')
    expect(css).toContain('.board-board')
    expect(css).toContain('.board-panel')
    expect(css).toContain('.board-row')
  })

  it('standardizes publisher schedule and insights on the shared board primitives', () => {
    for (const file of [
      'src/app/(dashboard)/dashboard/schedule/page.tsx',
      'src/app/(dashboard)/dashboard/insights/page.tsx',
    ]) {
      const page = source(file)

      expect(page).toContain('DashboardBoardPage')
      expect(page).toContain('DashboardBoardHeader')
      expect(page).toContain('DashboardBoardMetrics')
      expect(page).toContain('DashboardBoardPanel')
      expect(page).toContain('DashboardBoardRow')
      expect(page).not.toContain('pub-mast-title')
      expect(page).not.toContain('pub-ledger')
      expect(page).not.toContain('pub-wire')
      expect(page).not.toContain('pub-entry')
    }

    expect(source('src/components/dashboard/DashboardBoard.tsx')).toContain(
      'DashboardBoardStaticRow'
    )
  })

  it('applies the same compact board structure to all role overview dashboards', () => {
    for (const file of [
      'src/app/(dashboard)/dashboard/page.tsx',
      'src/app/(admin)/admin/page.tsx',
      'src/app/(super-admin)/super-admin/page.tsx',
      'src/app/(owner)/owner/page.tsx',
    ]) {
      const page = source(file)

      expect(page).toContain('DashboardBoardHeader')
      expect(page).toContain('DashboardBoardMetrics')
      if (file.includes('(owner)')) {
        expect(page).toContain('WorkspaceCard')
        expect(page).toContain('AttentionCard')
      } else {
        expect(page).toContain('DashboardBoardPanel')
        expect(page).toContain('DashboardBoardRow')
      }
    }
  })

  it('keeps cross-role dashboard switching owner-only in the rail and mobile drawer', () => {
    const navConfig = source('src/components/dashboard/nav-config.ts')
    const rail = source('src/components/dashboard/DashboardRail.tsx')
    const mobileNav = source('src/components/dashboard/DashboardMobileNav.tsx')

    expect(navConfig).toContain('ROLE_TABS')
    expect(navConfig).toContain("label: 'Publisher'")
    expect(navConfig).toContain("label: 'Admin'")
    expect(navConfig).toContain("label: 'Super'")
    expect(navConfig).toContain("label: 'Owner'")
    expect(navConfig.indexOf("label: 'Owner'")).toBeLessThan(
      navConfig.indexOf("label: 'Publisher'")
    )
    expect(navConfig).toContain("from '@/modules/auth/roles'")
    expect(navConfig).toContain('canAccessOwnerArea')
    expect(navConfig).toContain('canAccessSuperAdminArea')
    expect(navConfig).toContain('canAccessAdminArea')
    expect(navConfig).toContain('canAccessPublisherArea')
    expect(rail).toContain('workspaceTabs.length > 1')
    expect(rail).toContain('Workspace switcher')
    expect(rail).toContain("navItems.filter((item) => item.href !== '/')")
    expect(mobileNav).toContain('ROLE_TABS.map')
    expect(mobileNav).toContain('canUseRoleTab(role, tab.variant)')
  })

  it('uses a uniform desktop shell while preserving mobile navigation', () => {
    const shell = source('src/components/dashboard/DashboardShell.tsx')
    const rail = source('src/components/dashboard/DashboardRail.tsx')
    const topBar = source('src/components/dashboard/DashboardTopBar.tsx')
    const mobileNav = source('src/components/dashboard/DashboardMobileNav.tsx')
    const mobileDock = source('src/components/dashboard/DashboardMobileDock.tsx')

    expect(shell).toContain('md:pl-[4.5rem]')
    expect(shell).toContain('DashboardTopBar')
    expect(shell).toContain('DashboardRail')
    expect(shell).toContain('DashboardMobileNav')
    expect(shell).toContain('DashboardMobileDock')
    expect(rail).toContain('w-[4.5rem] hover:w-[17rem]')
    expect(rail).toContain('ROLE_CODES')
    expect(topBar).toContain("import { BrandMark } from '@/components/layout/BrandMark'")
    expect(topBar).toContain('fixed inset-x-0 top-0 z-40')
    expect(topBar).toContain('md:hidden')
    expect(topBar).toContain('preload')
    expect(mobileNav).toContain('<dialog')
    expect(mobileDock).toContain('dashboard-mobile-dock')
    expect(mobileDock).toContain('md:hidden')
  })

  it('gives the new announcement page a dedicated editor workflow', () => {
    const page = source('src/app/(dashboard)/dashboard/announcements/new/page.tsx')
    const form = source('src/components/dashboard/AnnouncementForm.tsx')
    const preview = source('src/components/dashboard/AnnouncementLivePreview.tsx')
    const readiness = source('src/components/dashboard/PublishingReadinessChecklist.tsx')
    const css = source('src/app/globals.css')

    expect(page).toContain('new-announcement-page')
    expect(page).toContain('DashboardBoardHeader')
    expect(page).toContain('New announcement')
    expect(page).toContain('Write the notice first')
    expect(page).toContain("export const metadata = { title: 'New Announcement' }")

    expect(form).toContain('announcement-form-shell')
    expect(form).toContain('announcement-editor-layout')
    expect(form).toContain('announcement-editor-main')
    expect(form).toContain('announcement-editor-aside')
    expect(form).toContain('announcement-section-card')
    expect(preview).toContain('announcement-preview-panel')
    expect(form).toContain('announcement-publishing-panel')
    expect(form).toContain('announcement-static-actionbar')
    expect(form).toContain('sticky={!isNew}')
    expect(readiness).toContain('Publishing readiness')

    expect(css).toContain('.new-announcement-page')
    expect(css).toContain('.announcement-editor-layout')
    expect(css).toContain('.announcement-editor-aside')
  })
})
