import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

function source(path: string) {
  return readFileSync(path, 'utf8')
}

describe('performance source guards', () => {
  it('bounds public and dashboard announcement queries', () => {
    const data = source('src/lib/data.ts')
    const dashboard = source('src/app/(dashboard)/dashboard/announcements/page.tsx')

    expect(data).toContain('PUBLIC_FEED_LIMIT')
    expect(data).toContain('.limit(PUBLIC_FEED_LIMIT)')
    expect(dashboard).toContain('DASHBOARD_ANNOUNCEMENTS_LIMIT')
    expect(dashboard).toContain('.range(0, DASHBOARD_ANNOUNCEMENTS_LIMIT - 1)')
  })

  it('keeps the internal brand lab out of public discovery', () => {
    const robots = source('src/app/robots.ts')
    const brandLab = source('src/app/brand-lab/page.tsx')

    expect(robots).toContain("'/brand-lab'")
    expect(brandLab).toContain('robots:')
    expect(brandLab).toContain('index: false')
    expect(brandLab).toContain('follow: false')
  })
})
