import { chromium } from '@playwright/test'
import { config as loadEnv } from 'dotenv'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'

loadEnv({ path: resolve(process.cwd(), '.env.test.local') })
loadEnv({ path: resolve(process.cwd(), '.env.local') })

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'
const outputDir = resolve(process.cwd(), 'test-results', 'feature-screenshots')

const roles = {
  owner: {
    email: process.env.TEST_OWNER_EMAIL,
    password: process.env.TEST_OWNER_PASSWORD,
    routes: [
      ['owner-01-dashboard', '/owner'],
      ['owner-02-users', '/owner/users'],
      ['owner-03-categories', '/owner/categories'],
      ['owner-04-analytics', '/owner/analytics'],
      ['owner-05-audit', '/owner/audit'],
      ['owner-06-notifications', '/owner/notifications'],
      ['owner-07-public-review-mode', '/'],
    ],
  },
  super_admin: {
    email: process.env.TEST_SUPER_ADMIN_EMAIL,
    password: process.env.TEST_SUPER_ADMIN_PASSWORD,
    routes: [
      ['super-admin-01-dashboard', '/super-admin'],
      ['super-admin-02-users', '/super-admin/users'],
      ['super-admin-03-admins', '/super-admin/admins'],
      ['super-admin-04-invite-admin', '/super-admin/admins/invite'],
      ['super-admin-05-categories', '/super-admin/categories'],
      ['super-admin-06-analytics', '/super-admin/analytics'],
      ['super-admin-07-notifications', '/super-admin/notifications'],
      ['super-admin-08-public-review-mode', '/'],
    ],
  },
  admin: {
    email: process.env.TEST_ADMIN_EMAIL,
    password: process.env.TEST_ADMIN_PASSWORD,
    routes: [
      ['admin-01-dashboard', '/admin'],
      ['admin-02-review-queue', '/admin/review'],
      ['admin-03-organizations', '/admin/orgs'],
      ['admin-04-new-organization', '/admin/orgs/new'],
      ['admin-05-publishers', '/admin/publishers'],
      ['admin-06-invite-publisher', '/admin/publishers/invite'],
      ['admin-07-users', '/admin/users'],
      ['admin-08-categories', '/admin/categories'],
      ['admin-09-analytics', '/admin/analytics'],
      ['admin-10-notifications', '/admin/notifications'],
      ['admin-11-public-review-mode', '/'],
    ],
  },
  publisher: {
    email: process.env.TEST_PUBLISHER_EMAIL,
    password: process.env.TEST_PUBLISHER_PASSWORD,
    routes: [
      ['publisher-01-dashboard', '/dashboard'],
      ['publisher-02-announcements', '/dashboard/announcements'],
      ['publisher-03-announcement-editor', '/dashboard/announcements/new'],
      ['publisher-04-notifications', '/dashboard/notifications'],
      ['publisher-05-public-review-mode', '/'],
    ],
  },
}

function urlFor(pathname) {
  return new URL(pathname, baseURL).toString()
}

function requireCredential(role, key, value) {
  if (!value) throw new Error(`${role}.${key} is missing from .env.test.local`)
  return value
}

async function preparePage(page) {
  await page.addStyleTag({
    content: `
      nextjs-portal,
      [data-nextjs-toast],
      [data-nextjs-dialog-overlay],
      [data-nextjs-build-error],
      [data-nextjs-dev-tools-button] {
        display: none !important;
      }
    `,
  }).catch(() => {})
}

async function capture(page, filename, pathname, options = {}) {
  await page.goto(urlFor(pathname), { waitUntil: 'domcontentloaded', timeout: 30_000 })
  await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => {})
  await preparePage(page)

  if (options.editorDemo) {
    await fillEditorDemo(page)
  }

  await page.waitForTimeout(900)
  await page.screenshot({
    path: resolve(outputDir, `${filename}.png`),
    fullPage: true,
  })

  return { filename: `${filename}.png`, url: page.url(), title: await page.title() }
}

async function fillEditorDemo(page) {
  const title = page.locator('#announcement-title')
  if ((await title.count()) === 1) {
    await title.fill('Orientation Week: Schedule and Registration')
  }

  const body = page.locator('#announcement-body')
  if ((await body.count()) === 1) {
    await body.fill(
      'Welcome activities, student services briefing, and club booth registration details for new INTI students.'
    )
  }

  const publishAt = page.locator('#scheduled-publish-at')
  if ((await publishAt.count()) === 1) {
    await publishAt.fill('2026-05-11T09:00')
  }

  const pinnedUntil = page.locator('#pinned-until')
  if ((await pinnedUntil.count()) === 1) {
    await pinnedUntil.fill('2026-05-15T18:00')
  }
}

async function login(page, role, credentials) {
  await page.goto(urlFor('/login'), { waitUntil: 'domcontentloaded', timeout: 30_000 })
  await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => {})
  await preparePage(page)
  await page.getByLabel(/email/i).fill(requireCredential(role, 'email', credentials.email))
  await page.getByLabel(/password/i).fill(requireCredential(role, 'password', credentials.password))
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.waitForURL(/\/(owner|super-admin|admin|dashboard)/, { timeout: 30_000 })
}

async function capturePublic(browser, results) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()

  results.push(await capture(page, 'public-01-feed', '/'))
  results.push(await capture(page, 'public-02-search', '/?q=exam'))

  await page.goto(urlFor('/'), { waitUntil: 'domcontentloaded', timeout: 30_000 })
  await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => {})
  await preparePage(page)
  const cards = page.locator('[data-testid="announcement-card"]')
  if ((await cards.count()) > 0) {
    await cards.first().click()
    await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => {})
    await preparePage(page)
    await page.screenshot({
      path: resolve(outputDir, 'public-03-announcement-detail.png'),
      fullPage: true,
    })
    results.push({
      filename: 'public-03-announcement-detail.png',
      url: page.url(),
      title: await page.title(),
    })
  }

  results.push(await capture(page, 'auth-01-login', '/login'))
  results.push(await capture(page, 'auth-02-register', '/register'))
  await context.close()
}

async function captureRole(browser, role, config, results) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  await login(page, role, config)

  for (const [filename, pathname] of config.routes) {
    results.push(
      await capture(page, filename, pathname, {
        editorDemo: filename === 'publisher-03-announcement-editor',
      })
    )

    if (filename === 'admin-02-review-queue') {
      const reviewLinks = page.locator('a[href^="/admin/review/"]')
      if ((await reviewLinks.count()) > 0) {
        await reviewLinks.first().click()
        await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => {})
        await preparePage(page)
        await page.screenshot({
          path: resolve(outputDir, 'admin-02b-review-detail.png'),
          fullPage: true,
        })
        results.push({
          filename: 'admin-02b-review-detail.png',
          url: page.url(),
          title: await page.title(),
        })
      }
    }
  }

  await context.close()
}

async function captureMobile(browser, results) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  })
  const page = await context.newPage()
  results.push(await capture(page, 'mobile-01-public-feed', '/'))

  await login(page, 'publisher', roles.publisher)
  results.push(await capture(page, 'mobile-02-publisher-dashboard', '/dashboard'))
  results.push(await capture(page, 'mobile-03-publisher-announcements', '/dashboard/announcements'))
  await context.close()
}

await mkdir(outputDir, { recursive: true })

const browser = await chromium.launch()
const results = []

try {
  await capturePublic(browser, results)

  for (const [role, config] of Object.entries(roles)) {
    await captureRole(browser, role, config, results)
  }

  await captureMobile(browser, results)
} finally {
  await browser.close()
}

console.log(JSON.stringify({ outputDir, count: results.length, results }, null, 2))
