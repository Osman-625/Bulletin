import { defineConfig, devices } from '@playwright/test'
import { config as loadEnv } from 'dotenv'
import { resolve } from 'path'

const root = resolve(__dirname, '..')

loadEnv({ path: resolve(root, '.env.test.local') })
loadEnv({ path: resolve(root, '.env.local') })

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'

process.env.E2E_DISABLE_RATE_LIMIT ??= '1'
process.env.SETUP_SECRET ??= 'test-setup-secret'

export default defineConfig({
  testDir: resolve(root, 'tests/e2e'),
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  webServer: {
    command: 'npm run dev',
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120_000,
    env: {
      ...process.env,
      PLAYWRIGHT_BASE_URL: baseURL,
      E2E_DISABLE_RATE_LIMIT: '1',
      SETUP_SECRET: process.env.SETUP_SECRET,
    },
  },
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
      name: 'desktop-safari',
      use: { browserName: 'webkit', viewport: { width: 1280, height: 720 } },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
    },
  ],
})
