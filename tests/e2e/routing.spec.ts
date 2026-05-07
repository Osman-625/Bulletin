import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/auth'
import { resetPublisherAccount, waitForPublisherPasswordReset } from './helpers/admin'

// ─── 2. Role-Based Route Access ───────────────────────────────────────────────

test.describe('Publisher route restrictions', () => {
  test.beforeEach(async ({ page }) => {
    await resetPublisherAccount()
    await waitForPublisherPasswordReset()
    await loginAs(page, 'publisher')
  })

  test('publisher cannot access /admin — redirected to /dashboard', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL('/dashboard')
  })

  test('publisher cannot access /super-admin — redirected to /dashboard', async ({ page }) => {
    await page.goto('/super-admin')
    await expect(page).toHaveURL('/dashboard')
  })

  test('publisher cannot access /owner — redirected to /dashboard', async ({ page }) => {
    await page.goto('/owner')
    await expect(page).toHaveURL('/dashboard')
  })
})

test.describe('Admin route restrictions', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin')
  })

  test('admin cannot access /super-admin — redirected to /admin', async ({ page }) => {
    await page.goto('/super-admin')
    await expect(page).toHaveURL('/admin')
  })

  test('admin cannot access /owner — redirected to /admin', async ({ page }) => {
    await page.goto('/owner')
    await expect(page).toHaveURL('/admin')
  })

  test('admin can access /dashboard publisher tools', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/dashboard')
  })

  test('admin can access /admin', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL('/admin')
  })
})

test.describe('Super-admin route restrictions', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'super_admin')
  })

  test('super_admin cannot access /owner — redirected to /super-admin', async ({ page }) => {
    await page.goto('/owner')
    await expect(page).toHaveURL('/super-admin')
  })

  test('super_admin can access /admin area', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL('/admin')
  })

  test('super_admin can access /dashboard publisher tools', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/dashboard')
  })

  test('super_admin can access /super-admin', async ({ page }) => {
    await page.goto('/super-admin')
    await expect(page).toHaveURL('/super-admin')
  })
})
