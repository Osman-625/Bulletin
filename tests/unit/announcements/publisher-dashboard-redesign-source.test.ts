import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

function source(path: string) {
  return readFileSync(path, 'utf8')
}

describe('publisher dashboard redesign source guards', () => {
  it('uses a focused publisher overview instead of a crowded command board', () => {
    const page = source('src/app/(dashboard)/dashboard/page.tsx')
    const css = source('src/app/globals.css')

    expect(page).toContain('publisher-dashboard-shell')
    expect(page).toContain('max-w-[92rem]')
    expect(page).toContain('publisher-command-layout')
    expect(page).toContain('publisher-overview-hero')
    expect(page).toContain('publisher-quiet-metrics')
    expect(page).toContain('publisher-workspace-board')
    expect(page).toContain('publisher-next-actions')
    expect(page).toContain('publisher-recent-list')
    expect(page).toContain('Start a new notice')
    expect(page).toContain('Review public board')
    expect(page).not.toContain('publisher-signal-row')
    expect(page).not.toContain('heroSignals')
    expect(page).not.toContain('Publishing readiness')
    expect(page).not.toContain('dashboard-surface-bridge')

    expect(css).toContain('.publisher-dashboard-shell')
    expect(css).toContain('.publisher-command-layout')
    expect(css).toContain('.publisher-overview-hero')
    expect(css).toContain('.publisher-quiet-metrics')
    expect(css).toContain('.publisher-workspace-board')
    expect(css).toContain('.publisher-next-actions')
    expect(css).toContain('.publisher-recent-list')
  })

  it('does not paint a separate dashboard background grid or framed backdrop', () => {
    const css = source('src/app/globals.css')

    expect(css).not.toContain('.dashboard-canvas::before')
    expect(css).not.toContain('.dashboard-surface-bridge')

    for (const selector of [
      '.publisher-command-layout',
      '.publisher-quiet-metrics',
      '.publisher-workspace-board',
      '.publisher-next-actions',
    ]) {
      const start = css.indexOf(`${selector} {`)
      const end = css.indexOf('\n  .', start + selector.length)
      const block = css.slice(start, end)

      expect(start).toBeGreaterThan(-1)
      expect(block).not.toContain('transparent 1px')
      expect(block).not.toContain('background-size:')
    }
  })

  it('gives the new announcement page a dedicated editor workflow', () => {
    const page = source('src/app/(dashboard)/dashboard/announcements/new/page.tsx')
    const form = source('src/components/dashboard/AnnouncementForm.tsx')
    const css = source('src/app/globals.css')

    expect(page).toContain('new-announcement-page')
    expect(page).toContain('new-announcement-intro')
    expect(page).toContain('New announcement')
    expect(page).toContain('Write the notice first')
    expect(page).toContain("export const metadata = { title: 'New Announcement' }")
    expect(page).not.toContain('New Announcement — Bulletin')

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
    expect(form).not.toContain('<ActionBar\n        status={displayStatus}')

    expect(css).toContain('.new-announcement-page')
    expect(css).toContain('.announcement-editor-layout')
    expect(css).toContain('.announcement-editor-aside')
    expect(css).not.toContain('.dashboard-surface-bridge')
  })

  it('renders readable descriptions in recent publisher announcement rows', () => {
    const page = source('src/app/(dashboard)/dashboard/page.tsx')
    const recentRow = source('src/components/dashboard/DashboardRecentRow.tsx')

    expect(recentRow).toContain('body: string | null')
    expect(recentRow).toContain('getAnnouncementExcerpt')
    expect(page).toContain('id, title, body, status, view_count, updated_at, categories(name)')
    expect(recentRow).toContain('announcement.body')
    expect(recentRow).toContain('line-clamp-2')
  })

  it('strengthens dashboard branding instead of hiding it in collapsed headers', () => {
    const shell = source('src/components/dashboard/DashboardShell.tsx')
    const sidebar = source('src/components/dashboard/DashboardSidebar.tsx')
    const topNav = source('src/components/dashboard/DashboardTopNav.tsx')

    expect(shell).toContain('md:pl-[5rem]')
    expect(shell).toContain('xl:pl-[19rem]')
    expect(sidebar).toContain('w-[5rem] xl:w-[19rem]')
    expect(sidebar).toContain('<BrandMark')
    expect(sidebar).toContain('size="md"')
    expect(sidebar).toContain('preload')
    expect(topNav).toContain("import { BrandMark } from '@/components/layout/BrandMark'")
    expect(topNav).toContain('md:hidden')
    expect(topNav).toContain('Publisher workspace')
    expect(topNav).toContain('preload')
  })
})
