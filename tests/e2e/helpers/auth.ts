import type { Page } from '@playwright/test'
import { requireEnv } from './env'

export async function loginAs(page: Page, role: 'owner' | 'super_admin' | 'admin' | 'publisher') {
  const creds: Record<string, { email: string; password: string }> = {
    owner: {
      email: requireEnv('TEST_OWNER_EMAIL'),
      password: requireEnv('TEST_OWNER_PASSWORD'),
    },
    super_admin: {
      email: requireEnv('TEST_SUPER_ADMIN_EMAIL'),
      password: requireEnv('TEST_SUPER_ADMIN_PASSWORD'),
    },
    admin: {
      email: requireEnv('TEST_ADMIN_EMAIL'),
      password: requireEnv('TEST_ADMIN_PASSWORD'),
    },
    publisher: {
      email: requireEnv('TEST_PUBLISHER_EMAIL'),
      password: requireEnv('TEST_PUBLISHER_PASSWORD'),
    },
  }

  const { email, password } = creds[role]
  await page.goto('/login')
  await page.getByLabel(/email or username/i).fill(email)
  await page.getByLabel(/password/i).fill(password)
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.waitForURL(/\/(owner|super-admin|admin|dashboard)/)
}

export async function logout(page: Page) {
  await page.goto('/login')
}
