import type { Page } from '@playwright/test'

type URLMatcher = Parameters<Page['waitForURL']>[0]

export async function gotoApp(page: Page, url: string) {
  await page.goto(url, { waitUntil: 'commit' })
}

export async function waitForAppURL(page: Page, url: URLMatcher, timeout = 45_000) {
  await page.waitForURL(url, { timeout, waitUntil: 'commit' })
}
