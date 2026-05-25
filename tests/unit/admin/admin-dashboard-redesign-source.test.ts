import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

function source(path: string) {
  return readFileSync(path, 'utf8')
}

describe('admin dashboard redesign source guards', () => {
  it('uses a focused admin overview instead of a crowded command board', () => {
    const page = source('src/app/(admin)/admin/page.tsx')
    const css = source('src/app/globals.css')

    expect(page).toContain('admin-dashboard-shell')
    expect(page).toContain('admin-command-layout')
    expect(page).toContain('admin-overview-header')
    expect(page).toContain('admin-quiet-metrics')
    expect(page).toContain('admin-workflow-board')
    expect(page).toContain('admin-review-panel')
    expect(page).toContain('admin-operations-panel')
    expect(page).toContain('admin-review-list')
    expect(page).toContain('admin-review-row')
    expect(page).toContain('Open full queue')
    expect(page).toContain('Operations')
    expect(page).not.toContain('What good review protects')
    expect(page).not.toContain('Review standards')
    expect(page).not.toContain('xl:col-span-4')

    expect(css).toContain('.admin-dashboard-shell')
    expect(css).toContain('.admin-command-layout')
    expect(css).toContain('.admin-overview-header')
    expect(css).toContain('.admin-quiet-metrics')
    expect(css).toContain('.admin-workflow-board')
    expect(css).toContain('.admin-review-panel')
    expect(css).toContain('.admin-operations-panel')
    expect(css).toContain('.admin-review-list')
    expect(css).toContain('.admin-review-row')
  })

  it('keeps the review queue page task-specific and low noise', () => {
    const page = source('src/app/(admin)/admin/review/page.tsx')

    expect(page).toContain('admin-review-page')
    expect(page).toContain('admin-review-header')
    expect(page).toContain('admin-review-list')
    expect(page).toContain('admin-review-row')
    expect(page).toContain('Review oldest submissions first')
    expect(page).not.toContain('dashboard-command-card rounded-[1.5rem] p-6')
    expect(page).not.toContain('flex min-h-24 min-w-32')
  })

  it('does not introduce a dashboard grid background for admin pages', () => {
    const css = source('src/app/globals.css')

    for (const selector of [
      '.admin-command-layout',
      '.admin-quiet-metrics',
      '.admin-workflow-board',
      '.admin-review-panel',
      '.admin-operations-panel',
    ]) {
      const start = css.indexOf(`${selector} {`)
      const end = css.indexOf('\n  .', start + selector.length)
      const block = css.slice(start, end)

      expect(start).toBeGreaterThan(-1)
      expect(block).not.toContain('transparent 1px')
      expect(block).not.toContain('background-size:')
    }
  })
})
