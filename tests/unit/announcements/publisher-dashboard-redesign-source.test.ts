import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

function source(path: string) {
  return readFileSync(path, 'utf8')
}

describe('dashboard desk redesign source guards', () => {
  it('uses the compact desk base for the publisher overview', () => {
    const page = source('src/app/(dashboard)/dashboard/page.tsx')
    const shared = source('src/components/dashboard/DashboardDesk.tsx')
    const css = source('src/app/globals.css')

    expect(page).toContain('publisher-dashboard-shell')
    expect(page).toContain('DashboardDeskHeader')
    expect(page).toContain('DashboardDeskMetrics')
    expect(page).toContain('DashboardDeskBoard')
    expect(page).toContain('Your announcements')
    expect(page).toContain('Needs attention')
    expect(page).toContain('New announcement')
    expect(page).not.toContain('pub-mast-title')
    expect(page).not.toContain('pub-ledger')
    expect(page).not.toContain('pub-wire')

    expect(shared).toContain('DashboardDeskHeader')
    expect(shared).toContain('DashboardDeskMetrics')
    expect(shared).toContain('DashboardDeskRow')
    expect(css).toContain('.desk-header')
    expect(css).toContain('.desk-metrics')
    expect(css).toContain('.desk-board')
    expect(css).toContain('.desk-panel')
    expect(css).toContain('.desk-row')
  })

  it('standardizes publisher schedule and insights on the shared desk primitives', () => {
    for (const file of [
      'src/app/(dashboard)/dashboard/schedule/page.tsx',
      'src/app/(dashboard)/dashboard/insights/page.tsx',
    ]) {
      const page = source(file)

      expect(page).toContain('DashboardDeskPage')
      expect(page).toContain('DashboardDeskHeader')
      expect(page).toContain('DashboardDeskMetrics')
      expect(page).toContain('DashboardDeskPanel')
      expect(page).toContain('DashboardDeskRow')
      expect(page).not.toContain('pub-mast-title')
      expect(page).not.toContain('pub-ledger')
      expect(page).not.toContain('pub-wire')
      expect(page).not.toContain('pub-entry')
    }

    expect(source('src/components/dashboard/DashboardDesk.tsx')).toContain('DashboardDeskStaticRow')
  })

  it('applies the same compact desk structure to all role overview dashboards', () => {
    for (const file of [
      'src/app/(dashboard)/dashboard/page.tsx',
      'src/app/(admin)/admin/page.tsx',
      'src/app/(super-admin)/super-admin/page.tsx',
      'src/app/(owner)/owner/page.tsx',
    ]) {
      const page = source(file)

      expect(page).toContain('DashboardDeskHeader')
      expect(page).toContain('DashboardDeskMetrics')
      expect(page).toContain('DashboardDeskPanel')
      expect(page).toContain('DashboardDeskRow')
    }
  })

  it('keeps cross-role dashboard switching owner-only in the sidebar', () => {
    const sidebar = source('src/components/dashboard/DashboardSidebar.tsx')

    expect(sidebar).toContain('ROLE_TABS')
    expect(sidebar).toContain("label: 'Publisher'")
    expect(sidebar).toContain("label: 'Admin'")
    expect(sidebar).toContain("label: 'Super'")
    expect(sidebar).toContain("label: 'Owner'")
    expect(sidebar.indexOf("label: 'Owner'")).toBeLessThan(sidebar.indexOf("label: 'Publisher'"))
    expect(sidebar).toContain("if (role === 'owner') return true")
    expect(sidebar).toContain("return tabVariant === 'super_admin'")
    expect(sidebar).toContain("return tabVariant === 'admin'")
    expect(sidebar).toContain("return tabVariant === 'publisher'")
    expect(sidebar).toContain('Only the owner can open another role dashboard')
    expect(sidebar).not.toContain("label: 'Publisher desk', icon: Megaphone")
    expect(sidebar).not.toContain("label: 'Admin desk', icon: ClipboardList")
  })

  it('uses a uniform desktop shell while preserving mobile navigation', () => {
    const shell = source('src/components/dashboard/DashboardShell.tsx')
    const sidebar = source('src/components/dashboard/DashboardSidebar.tsx')
    const topNav = source('src/components/dashboard/DashboardTopNav.tsx')

    expect(shell).toContain('md:pl-[5rem]')
    expect(shell).toContain('xl:pt-0 xl:pl-[18rem]')
    expect(shell).toContain('xl:hidden')
    expect(sidebar).toContain('w-[5rem] xl:w-[18rem]')
    expect(sidebar).toContain('<BrandMark')
    expect(sidebar).toContain('size="md"')
    expect(sidebar).toContain('preload')
    expect(topNav).toContain("import { BrandMark } from '@/components/layout/BrandMark'")
    expect(topNav).toContain('md:hidden')
    expect(topNav).toContain('xl:hidden')
    expect(topNav).toContain('preload')
  })

  it('gives the new announcement page a dedicated editor workflow', () => {
    const page = source('src/app/(dashboard)/dashboard/announcements/new/page.tsx')
    const form = source('src/components/dashboard/AnnouncementForm.tsx')
    const css = source('src/app/globals.css')

    expect(page).toContain('new-announcement-page')
    expect(page).toContain('DashboardDeskHeader')
    expect(page).toContain('New announcement')
    expect(page).toContain('Write the notice first')
    expect(page).toContain("export const metadata = { title: 'New Announcement' }")

    expect(form).toContain('announcement-form-shell')
    expect(form).toContain('announcement-editor-layout')
    expect(form).toContain('announcement-editor-main')
    expect(form).toContain('announcement-editor-aside')
    expect(form).toContain('announcement-section-card')
    expect(form).toContain('announcement-preview-panel')
    expect(form).toContain('announcement-publishing-panel')
    expect(form).toContain('announcement-static-actionbar')
    expect(form).toContain('sticky={!isNew}')
    expect(form).toContain('Publishing readiness')

    expect(css).toContain('.new-announcement-page')
    expect(css).toContain('.announcement-editor-layout')
    expect(css).toContain('.announcement-editor-aside')
  })
})
