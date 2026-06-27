import { expect, test } from '@playwright/test'

test('centers fixed announcement badges without changing card geometry', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/')

  const feed = page.locator('#announcements')
  await expect(feed).toBeVisible()

  const metrics = await page.evaluate(() => {
    return [...document.querySelectorAll<HTMLElement>('.card-without-image')]
      .map((card) => {
        const row = card.querySelector<HTMLElement>('.announcement-card-status')
        const badges = row ? [...row.querySelectorAll<HTMLElement>('.announcement-card-chip')] : []
        if (!row || badges.length === 0) return null
        const rowRect = row.getBoundingClientRect()

        return {
          badgeCount: badges.length,
          badgeHeights: badges.map((badge) => badge.getBoundingClientRect().height),
          centerOffsets: badges.map((badge) => {
            const rect = badge.getBoundingClientRect()
            return Math.abs(rowRect.top + rowRect.height / 2 - (rect.top + rect.height / 2))
          }),
          rowHeight: rowRect.height,
        }
      })
      .filter((metric): metric is NonNullable<typeof metric> => metric !== null)
  })

  expect(metrics.some((metric) => metric.badgeCount === 1)).toBe(true)
  expect(metrics.some((metric) => metric.badgeCount >= 2)).toBe(true)
  expect(metrics.every((metric) => Math.abs(metric.rowHeight - 28) <= 0.5)).toBe(true)
  expect(
    metrics.every((metric) =>
      metric.badgeHeights.every((height) => height >= 23.5 && height <= 24.5)
    ),
    JSON.stringify(metrics)
  ).toBe(true)
  expect(metrics.every((metric) => metric.centerOffsets.every((offset) => offset <= 0.5))).toBe(
    true
  )

  const featured = page.locator('[data-testid="announcement-card"][data-featured="true"]')
  await expect(featured).toBeVisible()

  const featuredGeometry = await featured.evaluate((card) => {
    const media = card.querySelector<HTMLElement>('[data-card-media]')
    const frame = card.querySelector<HTMLElement>('.announcement-card-image-frame')
    const image = card.querySelector<HTMLImageElement>('.announcement-card-image')
    if (!media || !frame || !image) return null

    const mediaRect = media.getBoundingClientRect()
    const frameRect = frame.getBoundingClientRect()

    return {
      objectFit: getComputedStyle(image).objectFit,
      edgeOffsets: {
        top: Math.abs(frameRect.top - mediaRect.top),
        right: Math.abs(frameRect.right - mediaRect.right),
        bottom: Math.abs(frameRect.bottom - mediaRect.bottom),
        left: Math.abs(frameRect.left - mediaRect.left),
      },
    }
  })

  expect(featuredGeometry).not.toBeNull()
  expect(featuredGeometry?.objectFit).toBe('contain')
  expect(
    featuredGeometry && Object.values(featuredGeometry.edgeOffsets).every((offset) => offset <= 1),
    JSON.stringify(featuredGeometry)
  ).toBe(true)
})
