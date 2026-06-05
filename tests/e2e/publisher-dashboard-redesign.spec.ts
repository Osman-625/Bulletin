import { expect, test } from '@playwright/test'
import { loginAs } from './helpers/auth'

test.describe('Publisher dashboard redesign', () => {
  test('renders the compact desktop desk shell', async ({ page }) => {
    await loginAs(page, 'publisher')
    await page.goto('/dashboard')

    await expect(page.locator('.publisher-desk-canvas')).toBeVisible()
    await expect(page.locator('.desk-header')).toBeVisible()
    await expect(page.locator('.desk-title')).toHaveText(/publisher desk/i)
    await expect(page.locator('.desk-metric-card')).toHaveCount(4)
    await expect(page.locator('.desk-board')).toBeVisible()
    await expect(page.getByRole('heading', { name: /your announcements/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /needs attention/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /^Publisher$/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /^Admin$/ })).toHaveCount(0)

    const sidebar = page.locator('aside').first()
    await expect(sidebar).toBeVisible()
    await expect(sidebar).toHaveCSS('width', '288px')
    await expect(page.locator('header.fixed')).toBeHidden()

    await page.screenshot({
      path: 'test-results/publisher-dashboard-redesign-desktop.png',
      fullPage: true,
    })
  })
})
