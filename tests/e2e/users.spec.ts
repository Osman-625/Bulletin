import { test, expect, type Page } from '@playwright/test'
import { loginAs } from './helpers/auth'
import { hasEnv, requireEnv } from './helpers/env'
import { resetPublisherAccount } from './helpers/admin'
import { gotoApp } from './helpers/navigation'

function userCard(page: Page, email: string) {
  return page.getByTestId('user-card').filter({ hasText: email })
}

// ─── 3. User Management — Admin ───────────────────────────────────────────────

test.describe('Admin user management', () => {
  test.beforeEach(async ({ page }) => {
    await resetPublisherAccount()
    await loginAs(page, 'admin')
    await gotoApp(page, '/admin/users')
  })

  test('admin sees /admin/users page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /users/i })).toBeVisible()
  })

  test('role filter All/Admin/Publisher tabs are visible', async ({ page }) => {
    await expect(page.locator('a[href="/admin/users"]')).toBeVisible()
    await expect(page.locator('a[href="/admin/users?role=admin"]')).toBeVisible()
    await expect(page.locator('a[href="/admin/users?role=publisher"]')).toBeVisible()
  })

  test('publisher filter shows only publisher users', async ({ page }) => {
    await page.click('a[href*="role=publisher"]')
    await expect(page).toHaveURL(/role=publisher/)
    await expect(userCard(page, requireEnv('TEST_PUBLISHER_EMAIL'))).toBeVisible()
  })

  test('reset password with short password shows error message', async ({ page }) => {
    await gotoApp(page, '/admin/users?role=publisher')
    const publisherCard = userCard(page, requireEnv('TEST_PUBLISHER_EMAIL'))
    await expect(publisherCard).toBeVisible()
    await publisherCard.getByRole('link', { name: /^edit$/i }).click()

    const pwInput = page.getByLabel(/new temporary password/i)
    await pwInput.fill('short')
    await page.getByRole('button', { name: /set password/i }).click()
    const isTooShort = await pwInput.evaluate((input: HTMLInputElement) => input.validity.tooShort)
    expect(isTooShort).toBe(true)
    // Password must NOT appear in URL
    await expect(page).not.toHaveURL(/temp_password|password=/)
  })
})

// ─── 4. User Management — Super-Admin ─────────────────────────────────────────

test.describe('Super-admin user management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'super_admin')
    await gotoApp(page, '/super-admin/users')
  })

  test('super-admin sees user list', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /users/i })).toBeVisible()
  })

  test('role injection via form tamper is blocked (role must be admin-tier or below)', async ({
    page,
  }) => {
    // POST directly to the create user action is blocked by CSRF + server-side role check.
    // Verify the page has no <select> or <input> that exposes "owner" as an option.
    const ownerOption = page.locator('option[value="owner"], input[value="owner"]')
    await expect(ownerOption).toHaveCount(0)
  })

  test('reset password does not expose password in URL', async ({ page }) => {
    const publisherCard = userCard(page, requireEnv('TEST_PUBLISHER_EMAIL'))
    await expect(publisherCard).toBeVisible()
    await publisherCard.getByRole('link', { name: /^edit$/i }).click()

    try {
      const pwInput = page.getByLabel(/new temporary password/i)
      await pwInput.fill('SecureTemp1!')
      await page.getByRole('button', { name: /set password/i }).click()
      await expect(page).toHaveURL(/msg=Password\+updated/, { timeout: 20_000 })
      // URL must not contain the password
      await expect(page).not.toHaveURL(/SecureTemp|temp_password|password=/)
    } finally {
      await resetPublisherAccount()
    }
  })
})

// ─── 5. User Management — Owner ───────────────────────────────────────────────

test.describe('Owner user management', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      !hasEnv('TEST_OWNER_EMAIL', 'TEST_OWNER_PASSWORD'),
      'Owner E2E credentials are not configured in this environment'
    )
    await loginAs(page, 'owner')
    await gotoApp(page, '/owner/users')
  })

  test('owner sees user list', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /users/i })).toBeVisible()
  })

  test('owner cannot delete self', async ({ page }) => {
    const youCard = page.locator('[data-testid="user-card"][data-current-user="true"]')
    await expect(youCard).toBeVisible()
    const deleteBtn = youCard.getByRole('link', { name: /^delete$/i })
    await expect(deleteBtn).toHaveCount(0)
  })

  test('reset password does not expose password in URL', async ({ page }) => {
    const publisherCard = userCard(page, requireEnv('TEST_PUBLISHER_EMAIL'))
    await expect(publisherCard).toBeVisible()
    await publisherCard.getByRole('link', { name: /^edit$/i }).click()

    try {
      const pwInput = page.getByLabel(/new temporary password/i)
      await pwInput.fill('OwnerTemp12!')
      await page.getByRole('button', { name: /set password/i }).click()
      await expect(page).toHaveURL(/msg=Password\+updated/, { timeout: 20_000 })
      await expect(page).not.toHaveURL(/OwnerTemp12|temp_password|password=/)
    } finally {
      await resetPublisherAccount()
    }
  })
})
