import type { Page } from '@playwright/test'
import { requireEnv } from './env'

export type TestRole = 'owner' | 'super_admin' | 'admin' | 'publisher'

export function credentialsForRole(role: TestRole) {
  switch (role) {
    case 'owner':
      return {
        email: requireEnv('TEST_OWNER_EMAIL'),
        password: requireEnv('TEST_OWNER_PASSWORD'),
      }
    case 'super_admin':
      return {
        email: requireEnv('TEST_SUPER_ADMIN_EMAIL'),
        password: requireEnv('TEST_SUPER_ADMIN_PASSWORD'),
      }
    case 'admin':
      return {
        email: requireEnv('TEST_ADMIN_EMAIL'),
        password: requireEnv('TEST_ADMIN_PASSWORD'),
      }
    case 'publisher':
      return {
        email: requireEnv('TEST_PUBLISHER_EMAIL'),
        password: requireEnv('TEST_PUBLISHER_PASSWORD'),
      }
  }
}

export async function loginAs(page: Page, role: TestRole) {
  const { email, password } = credentialsForRole(role)
  await page.goto('/login')
  await page.getByLabel(/email or username/i).fill(email)
  await page.getByLabel(/password/i).fill(password)
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.waitForURL(/\/(owner|super-admin|admin|dashboard)/)
}

export async function logout(page: Page) {
  await page.goto('/login')
}
