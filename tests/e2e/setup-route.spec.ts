import { test, expect } from '@playwright/test'
import { requireEnv } from './helpers/env'

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'

// ─── 9. Setup Route ───────────────────────────────────────────────────────────
// The endpoint is disabled unless ENABLE_SETUP_ROUTE=1. When enabled, the rate
// limiter fires before the secret check, so heavy parallel runs may see 429.

test.describe('POST /api/setup security', () => {
  test('denies setup when x-setup-secret header is missing', async ({ request }) => {
    const res = await request.post(`${BASE}/api/setup`)
    expect([403, 404, 429]).toContain(res.status())
  })

  test('denies setup when x-setup-secret header is wrong', async ({ request }) => {
    const res = await request.post(`${BASE}/api/setup`, {
      headers: { 'x-setup-secret': 'wrong-secret-value' },
    })
    expect([403, 404, 429]).toContain(res.status())
  })

  test('does not expose owner bootstrap unless explicitly enabled with correct secret', async ({
    request,
  }) => {
    const res = await request.post(`${BASE}/api/setup`, {
      headers: { 'x-setup-secret': requireEnv('SETUP_SECRET') },
    })
    expect([200, 404, 409, 412]).toContain(res.status())
    if (res.status() === 200) {
      const body = await res.json()
      expect(body).not.toHaveProperty('temp_password')
      expect(body).toHaveProperty('note')
    }
  })
})
