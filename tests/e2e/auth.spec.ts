import { test, expect } from '@playwright/test'
import { requireEnv } from './helpers/env'
import {
  resetForceChangeAccount,
  resetPublisherAccount,
  waitForPublisherPasswordReset,
} from './helpers/admin'
import { gotoApp, waitForAppURL } from './helpers/navigation'

// ─── 1. Authentication & Session ────────────────────────────────────────────

test.describe('Login', () => {
  test('wrong credentials shows error, stays on /login', async ({ page }) => {
    await gotoApp(page, '/login')
    await page.getByLabel(/email or username/i).fill('nobody@example.com')
    await page.getByLabel(/password/i).fill('WrongPass1!')
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByText(/invalid/i)).toBeVisible()
  })

  test('publisher login redirects to /dashboard', async ({ page }) => {
    await resetPublisherAccount()
    await waitForPublisherPasswordReset()

    await gotoApp(page, '/login')
    await page.getByLabel(/email or username/i).fill(requireEnv('TEST_PUBLISHER_EMAIL'))
    await page.getByLabel(/password/i).fill(requireEnv('TEST_PUBLISHER_PASSWORD'))
    await page.getByRole('button', { name: /sign in/i }).click()
    await waitForAppURL(page, '/dashboard')
  })

  test('admin login redirects to /admin', async ({ page }) => {
    await gotoApp(page, '/login')
    await page.getByLabel(/email or username/i).fill(requireEnv('TEST_ADMIN_EMAIL'))
    await page.getByLabel(/password/i).fill(requireEnv('TEST_ADMIN_PASSWORD'))
    await page.getByRole('button', { name: /sign in/i }).click()
    await waitForAppURL(page, '/admin')
  })

  test('super_admin login redirects to /super-admin', async ({ page }) => {
    await gotoApp(page, '/login')
    await page.getByLabel(/email or username/i).fill(requireEnv('TEST_SUPER_ADMIN_EMAIL'))
    await page.getByLabel(/password/i).fill(requireEnv('TEST_SUPER_ADMIN_PASSWORD'))
    await page.getByRole('button', { name: /sign in/i }).click()
    await waitForAppURL(page, '/super-admin')
  })
})

test.describe('Unauthenticated access', () => {
  test('/dashboard redirects to /login when unauthenticated', async ({ page }) => {
    await gotoApp(page, '/dashboard')
    await expect(page).toHaveURL('/login')
  })

  test('/admin redirects to /login when unauthenticated', async ({ page }) => {
    await gotoApp(page, '/admin')
    await expect(page).toHaveURL('/login')
  })

  test('/super-admin redirects to /login when unauthenticated', async ({ page }) => {
    await gotoApp(page, '/super-admin')
    await expect(page).toHaveURL('/login')
  })

  test('/owner redirects to /login when unauthenticated', async ({ page }) => {
    await gotoApp(page, '/owner')
    await expect(page).toHaveURL('/login')
  })
})

test.describe('Change password flow', () => {
  test('admin redirected to /admin after password change', async ({ page }) => {
    await resetForceChangeAccount()

    await gotoApp(page, '/login')
    await page.getByLabel(/email or username/i).fill(requireEnv('TEST_FORCE_CHANGE_EMAIL'))
    await page.getByLabel(/password/i).fill(requireEnv('TEST_FORCE_CHANGE_PASSWORD'))
    await page.getByRole('button', { name: /sign in/i }).click()
    await waitForAppURL(page, '/change-password')

    const newPw = `TestPw${Date.now()}!`
    await page.getByLabel(/new password/i).fill(newPw)
    await page.getByLabel(/confirm/i).fill(newPw)
    await page.getByRole('button', { name: /update password/i }).click()
    await waitForAppURL(page, '/admin')
  })
})
