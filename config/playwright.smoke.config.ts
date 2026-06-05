import { defineConfig, devices } from '@playwright/test'
import { config as loadEnv } from 'dotenv'
import { resolve } from 'path'

const root = resolve(__dirname, '..')

loadEnv({ path: resolve(root, '.env.test.local') })
loadEnv({ path: resolve(root, '.env.local') })

const allowLocalSmoke = process.env.ALLOW_LOCAL_SMOKE === '1'
const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ?? (allowLocalSmoke ? 'http://localhost:3000' : undefined)

if (!baseURL) {
  throw new Error(
    'PLAYWRIGHT_BASE_URL is required for deployment smoke tests. Set ALLOW_LOCAL_SMOKE=1 only for explicit local smoke runs.'
  )
}

export default defineConfig({
  testDir: resolve(root, 'tests/e2e'),
  testMatch: 'deploy-smoke.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 1,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'desktop-chrome',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 720 } },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
})
