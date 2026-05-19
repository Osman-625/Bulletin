import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/auth'
import {
  bannerStoragePath,
  deleteAnnouncementsByTitle,
  getAnnouncementByTitle,
  removeBannerStoragePaths,
  resetPublisherAccount,
  storageObjectExists,
} from './helpers/admin'

const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
  'base64'
)

test.describe('Publisher review workflow', () => {
  test.setTimeout(90_000)

  test('publisher submits an announcement and admin approval publishes it to the public feed', async ({
    browser,
  }) => {
    const title = `E2E Publisher Flow ${Date.now()}`
    const body = 'This announcement was created by the publisher workflow smoke test.'
    let announcementId: string | null = null

    await resetPublisherAccount()
    await deleteAnnouncementsByTitle(title)

    try {
      const publisherContext = await browser.newContext()
      const publisherPage = await publisherContext.newPage()
      const redirectClientErrors: string[] = []
      publisherPage.on('console', (message) => {
        const text = message.text()
        if (
          message.type() === 'error' &&
          text.includes('[client-error]') &&
          text.includes('NEXT_REDIRECT')
        ) {
          redirectClientErrors.push(text)
        }
      })
      await loginAs(publisherPage, 'publisher')
      await publisherPage.goto('/dashboard/announcements/new')

      await publisherPage.getByLabel(/^title$/i).fill(title)
      await publisherPage.getByLabel(/^body$/i).fill(body)
      await publisherPage.locator('#banner-image-upload').setInputFiles({
        name: 'workflow-banner.png',
        mimeType: 'image/png',
        buffer: TINY_PNG,
      })
      await expect(publisherPage.getByAltText('Banner preview')).toBeVisible({ timeout: 20_000 })
      await publisherPage.getByRole('button', { name: /submit for review/i }).click()
      await publisherPage.waitForURL(/\/dashboard\/announcements\/[0-9a-f-]+\/edit/, {
        timeout: 20_000,
      })
      expect(redirectClientErrors).toEqual([])
      announcementId =
        publisherPage.url().match(/\/dashboard\/announcements\/([^/]+)\/edit/)?.[1] ?? null
      expect(announcementId).toBeTruthy()
      await publisherContext.close()

      await expect
        .poll(async () => (await getAnnouncementByTitle(title))?.status, { timeout: 20_000 })
        .toBe('submitted')

      const adminContext = await browser.newContext()
      const adminPage = await adminContext.newPage()
      await loginAs(adminPage, 'admin')
      await adminPage.goto(`/admin/review/${announcementId}`)
      await expect(adminPage.getByRole('heading', { name: title })).toBeVisible()
      await Promise.all([
        adminPage.waitForURL(/\/admin\/review\/?$/, { timeout: 20_000 }),
        adminPage.getByRole('button', { name: /approve and publish/i }).click(),
      ])

      await expect
        .poll(async () => (await getAnnouncementByTitle(title))?.status, { timeout: 20_000 })
        .toBe('published')

      const approved = await getAnnouncementByTitle(title)
      expect(approved?.published_at).toBeTruthy()
      expect(approved?.banner_url).toContain('/storage/v1/object/public/banner-images/')
      await adminContext.close()

      const publicContext = await browser.newContext()
      const publicPage = await publicContext.newPage()
      await publicPage.goto(`/?q=${encodeURIComponent(title)}`)
      await expect(publicPage.getByRole('heading', { name: title, level: 2 })).toBeVisible()
      await expect(publicPage.getByRole('img', { name: title }).first()).toBeVisible()
      await publicContext.close()
    } finally {
      await deleteAnnouncementsByTitle(title)
    }
  })

  test('publisher removing a banner cleans up the old storage object', async ({ browser }) => {
    const title = `E2E Banner Cleanup ${Date.now()}`
    const body = 'This draft verifies that removed banner images are cleaned up from storage.'
    const cleanupStoragePaths: string[] = []

    await resetPublisherAccount()
    await deleteAnnouncementsByTitle(title)

    try {
      const publisherContext = await browser.newContext()
      const publisherPage = await publisherContext.newPage()
      const redirectClientErrors: string[] = []
      publisherPage.on('console', (message) => {
        const text = message.text()
        if (
          message.type() === 'error' &&
          text.includes('[client-error]') &&
          text.includes('NEXT_REDIRECT')
        ) {
          redirectClientErrors.push(text)
        }
      })
      await loginAs(publisherPage, 'publisher')
      await publisherPage.goto('/dashboard/announcements/new')

      await publisherPage.getByLabel(/^title$/i).fill(title)
      await publisherPage.getByLabel(/^body$/i).fill(body)
      await publisherPage.locator('#banner-image-upload').setInputFiles({
        name: 'cleanup-banner.png',
        mimeType: 'image/png',
        buffer: TINY_PNG,
      })
      await expect(publisherPage.getByAltText('Banner preview')).toBeVisible({ timeout: 20_000 })
      await publisherPage.getByRole('button', { name: /save draft/i }).click()
      await publisherPage.waitForURL(/\/dashboard\/announcements\/[0-9a-f-]+\/edit/, {
        timeout: 20_000,
      })
      expect(redirectClientErrors).toEqual([])

      const draft = await getAnnouncementByTitle(title)
      const oldStoragePath = bannerStoragePath(draft?.banner_url ?? null)
      expect(oldStoragePath).toBeTruthy()
      cleanupStoragePaths.push(oldStoragePath!)

      await expect
        .poll(async () => storageObjectExists(oldStoragePath!), { timeout: 20_000 })
        .toBe(true)

      await publisherPage.getByRole('button', { name: /^remove$/i }).click()
      await publisherPage.getByRole('button', { name: /save draft/i }).click()

      await expect
        .poll(async () => (await getAnnouncementByTitle(title))?.banner_url ?? null, {
          timeout: 20_000,
        })
        .toBeNull()
      await expect
        .poll(async () => storageObjectExists(oldStoragePath!), { timeout: 20_000 })
        .toBe(false)

      await publisherContext.close()
    } finally {
      await removeBannerStoragePaths(cleanupStoragePaths)
      await deleteAnnouncementsByTitle(title)
    }
  })
})
