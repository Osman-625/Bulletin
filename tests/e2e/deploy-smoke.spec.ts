import { expect, test } from '@playwright/test'

const BASE = process.env.PLAYWRIGHT_BASE_URL

if (!BASE) {
  throw new Error('PLAYWRIGHT_BASE_URL is required for deployment smoke tests.')
}

test.describe('deployment smoke', () => {
  test.setTimeout(60_000)

  test('public shell, login, setup guard, and mobile viewport respond', async ({
    page,
    request,
  }) => {
    const homeResponse = await page.goto('/', { waitUntil: 'domcontentloaded' })
    const csp = homeResponse?.headers()['content-security-policy'] ?? ''

    expect(csp).toContain("script-src 'self' 'nonce-")
    expect(csp).toContain("'strict-dynamic'")
    expect(csp).not.toContain("'unsafe-eval'")
    expect(csp).not.toContain("script-src 'self' 'unsafe-inline'")

    await expect(page.getByRole('main')).toBeVisible()
    await expect(page.getByRole('heading', { name: /campus bulletin/i })).toBeVisible()

    await page.getByPlaceholder(/search/i).fill('xyznotfound12345')
    await page.getByRole('button', { name: /^search$/i }).click()
    await expect(page.getByText(/No matching notices|No announcements/i)).toBeVisible()

    await page.goto('/login', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
    await expect(page.getByPlaceholder(/email or username/i)).toBeVisible()

    const setup = await request.post(`${BASE}/api/setup`)
    expect([403, 404, 429]).toContain(setup.status())

    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('main')).toBeVisible()
  })
})
