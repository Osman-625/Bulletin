import { expect, test } from '@playwright/test'
import { loginAs, type TestRole } from './helpers/auth'

const roleRoutes: Array<{ role: TestRole; path: string; title: RegExp }> = [
  { role: 'publisher', path: '/dashboard', title: /publisher desk/i },
  { role: 'admin', path: '/admin', title: /admin desk/i },
  { role: 'super_admin', path: '/super-admin', title: /super desk/i },
  { role: 'owner', path: '/owner', title: /owner desk/i },
]

const secondaryRoutes: Array<{ role: TestRole; path: string; title: RegExp }> = [
  { role: 'publisher', path: '/dashboard/announcements', title: /manage campus posts/i },
  { role: 'publisher', path: '/dashboard/announcements/new', title: /new announcement/i },
  { role: 'publisher', path: '/dashboard/settings', title: /settings/i },
  { role: 'admin', path: '/admin/review', title: /review queue/i },
  { role: 'admin', path: '/admin/categories', title: /categories/i },
  { role: 'admin', path: '/admin/orgs/new', title: /new organization/i },
  { role: 'admin', path: '/admin/publishers/invite', title: /invite publisher/i },
  { role: 'admin', path: '/admin/users', title: /users/i },
  { role: 'super_admin', path: '/super-admin/admins', title: /admins/i },
  { role: 'super_admin', path: '/super-admin/admins/invite', title: /invite admin/i },
  { role: 'super_admin', path: '/super-admin/categories', title: /categories/i },
  { role: 'super_admin', path: '/super-admin/users', title: /users/i },
]

function hasCredentials(role: TestRole) {
  const prefix = role.toUpperCase()
  return Boolean(process.env[`TEST_${prefix}_EMAIL`] && process.env[`TEST_${prefix}_PASSWORD`])
}

test.describe('Dashboard uniformity and role access', () => {
  for (const { role, path, title } of roleRoutes) {
    test(`${role} sees the compact desk for their own dashboard`, async ({ page }) => {
      test.skip(!hasCredentials(role), `No ${role} credentials configured`)

      await loginAs(page, role)
      await page.goto(path)

      await expect(page.locator('.desk-header')).toBeVisible()
      await expect(page.locator('.desk-title')).toHaveText(title)
      await expect(page.locator('.desk-metric-card')).toHaveCount(4)
      await expect(page.locator('.desk-panel').first()).toBeVisible()
      await expect(page.locator('header.fixed')).toBeHidden()

      await page.screenshot({
        path: `test-results/dashboard-uniformity-${role}.png`,
        fullPage: true,
      })
    })
  }

  for (const { role, path, title } of secondaryRoutes) {
    test(`${role} sees the compact desk on ${path}`, async ({ page }) => {
      test.skip(!hasCredentials(role), `No ${role} credentials configured`)

      await loginAs(page, role)
      await page.goto(path)

      await expect(page.locator('.desk-header')).toBeVisible()
      await expect(page.locator('.desk-title')).toHaveText(title)
      await expect(page.locator('aside').first()).toHaveCSS('width', '288px')
      await expect(page.locator('header.fixed')).toBeHidden()

      const screenshotName = path.replace(/^\/+/, '').replace(/[^a-z0-9]+/gi, '-')
      await page.screenshot({
        path: `test-results/dashboard-secondary-${role}-${screenshotName}.png`,
        fullPage: true,
      })
    })
  }

  test('owner can open every role dashboard with owner credentials', async ({ page }) => {
    test.skip(!hasCredentials('owner'), 'No owner credentials configured')

    await loginAs(page, 'owner')

    for (const { path, title } of roleRoutes) {
      await page.goto(path)
      await expect(page).toHaveURL(new RegExp(`${path.replace('/', '\\/')}$`))
      await expect(page.locator('.desk-title')).toHaveText(title)
      await expect(page.locator('.desk-metric-card')).toHaveCount(4)
    }
  })

  for (const { role, blockedPath, expectedPath } of [
    { role: 'publisher' as const, blockedPath: '/admin', expectedPath: /\/dashboard$/ },
    { role: 'admin' as const, blockedPath: '/dashboard', expectedPath: /\/admin$/ },
    { role: 'super_admin' as const, blockedPath: '/admin', expectedPath: /\/super-admin$/ },
    { role: 'super_admin' as const, blockedPath: '/dashboard', expectedPath: /\/super-admin$/ },
  ]) {
    test(`${role} is redirected away from ${blockedPath}`, async ({ page }) => {
      test.skip(!hasCredentials(role), `No ${role} credentials configured`)

      await loginAs(page, role)
      await page.goto(blockedPath)
      await expect(page).toHaveURL(expectedPath)
    })
  }
})
