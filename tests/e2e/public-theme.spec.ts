import { expect, test } from '@playwright/test'

test.describe('Future Commons theme surfaces', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem('theme', 'light'))
  })

  test('public header exposes a sliding theme switch that toggles dark mode', async ({ page }) => {
    await page.goto('/')

    const switchControl = page.getByRole('switch', { name: /theme/i })
    await expect(switchControl).toBeVisible()
    await expect(switchControl).toHaveAttribute('aria-checked', 'false')

    const knob = switchControl.locator('[data-testid="theme-switch-knob"]')
    const before = await knob.boundingBox()

    await switchControl.click()

    await expect(page.locator('html')).toHaveClass(/dark/)
    await expect(switchControl).toHaveAttribute('aria-checked', 'true')
    await expect
      .poll(async () => {
        const current = await knob.boundingBox()
        return current?.x
      })
      .not.toBe(before?.x)
  })

  test('login page keeps the branded form usable and themeable', async ({ page }) => {
    await page.goto('/login')

    await expect(page.getByTestId('login-card')).toBeVisible()
    await expect(page.getByRole('button', { name: /go back/i })).toBeVisible()
    await expect(page.getByLabel(/email or username/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /^sign in$/i })).toBeVisible()

    const switchControl = page.getByRole('switch', { name: /theme/i })
    await expect(switchControl).toBeVisible()

    await switchControl.click()
    await expect(page.locator('html')).toHaveClass(/dark/)
  })
})
