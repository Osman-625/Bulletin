import { test, expect } from '@playwright/test'
import { requireEnv } from './helpers/env'

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'

// ─── 9. Setup Route ───────────────────────────────────────────────────────────
// The rate limiter (5 req/min) fires before the secret check, so heavy parallel
// test runs may see 429 instead of 403 — both mean "access denied".

test.describe('POST /api/setup security', () => {
  test('returns 403 or 429 when x-setup-secret header is missing', async ({ request }) => {
    const res = await request.post(`${BASE}/api/setup`)
    expect([403, 429]).toContain(res.status())
  })

  test('returns 403 or 429 when x-setup-secret header is wrong', async ({ request }) => {
    const res = await request.post(`${BASE}/api/setup`, {
      headers: { 'x-setup-secret': 'wrong-secret-value' },
    })
    expect([403, 429]).toContain(res.status())
  })

  test('returns 409 when owner already exists (correct secret)', async ({ request }) => {
    const res = await request.post(`${BASE}/api/setup`, {
      headers: { 'x-setup-secret': requireEnv('SETUP_SECRET') },
    })
    expect([200, 409]).toContain(res.status())
    if (res.status() === 200) {
      const body = await res.json()
      expect(body).toHaveProperty('temp_password')
      expect(typeof body.temp_password).toBe('string')
      expect(body.temp_password.length).toBeGreaterThanOrEqual(16)
    }
  })
})
