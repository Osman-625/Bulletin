import { expect, test } from '@playwright/test'

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'

test.describe('deployment smoke', () => {
  test('public shell, login, setup guard, and mobile viewport respond', async ({
    page,
    request,
  }) => {
    await page.goto('/')
    await expect(page.getByRole('main')).toBeVisible()
    await expect(page.getByRole('heading', { name: /campus bulletin/i })).toBeVisible()

    await page.getByPlaceholder(/search/i).fill('xyznotfound12345')
    await page.getByRole('button', { name: /^search$/i }).click()
    await expect(page.getByText('No announcements', { exact: true })).toBeVisible()

    await page.goto('/login')
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
    await expect(page.getByPlaceholder(/email or username/i)).toBeVisible()

    const setup = await request.post(`${BASE}/api/setup`)
    expect([403, 404, 429]).toContain(setup.status())

    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await expect(page.getByRole('main')).toBeVisible()
  })
})
