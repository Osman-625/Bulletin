import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

function source(path: string) {
  return readFileSync(path, 'utf8')
}

describe('admin dashboard redesign source guards', () => {
  it('uses a focused admin overview instead of a crowded command board', () => {
    const page = source('src/app/(admin)/admin/page.tsx')

    expect(page).toContain('admin-dashboard-shell')
    expect(page).toContain('DashboardDeskPage')
    expect(page).toContain('DashboardDeskHeader')
    expect(page).toContain('DashboardDeskMetrics')
    expect(page).toContain('DashboardDeskBoard')
    expect(page).toContain('DashboardDeskPanel')
    expect(page).toContain('DashboardDeskRow')
    expect(page).toContain('Review queue')
    expect(page).toContain('Needs attention')
    expect(page).toContain('Open queue')
    expect(page).toContain('View queue')
    expect(page).not.toContain('What good review protects')
    expect(page).not.toContain('Review standards')
    expect(page).not.toContain('xl:col-span-4')
  })

  it('keeps the review queue page task-specific and low noise', () => {
    const page = source('src/app/(admin)/admin/review/page.tsx')

    expect(page).toContain('admin-review-page')
    expect(page).toContain('DashboardDeskHeader')
    expect(page).toContain('DashboardDeskMetrics')
    expect(page).toContain('DashboardDeskPanel')
    expect(page).toContain('admin-review-list')
    expect(page).toContain('admin-review-row')
    expect(page).toContain('Review oldest submissions first')
    expect(page).not.toContain('dashboard-command-card rounded-[1.5rem] p-6')
    expect(page).not.toContain('flex min-h-24 min-w-32')
  })

  it('does not introduce a dashboard grid background for admin pages', () => {
    const adminPage = source('src/app/(admin)/admin/page.tsx')
    const reviewPage = source('src/app/(admin)/admin/review/page.tsx')

    expect(adminPage).not.toContain('admin-command-layout')
    expect(adminPage).not.toContain('admin-quiet-metrics')
    expect(adminPage).not.toContain('admin-workflow-board')
    expect(adminPage).not.toContain('transparent 1px')
    expect(adminPage).not.toContain('background-size:')
    expect(reviewPage).not.toContain('admin-command-layout')
    expect(reviewPage).not.toContain('admin-quiet-metrics')
    expect(reviewPage).not.toContain('admin-workflow-board')
    expect(reviewPage).not.toContain('transparent 1px')
    expect(reviewPage).not.toContain('background-size:')
  })
})
