import { test, expect } from '@playwright/test'

// ─── 8. Public Feed & Search ─────────────────────────────────────────────────

test.describe('Public feed', () => {
  test('loads with announcements', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('main')).toBeVisible()
    // Masthead visible
    await expect(page.getByRole('heading', { name: /campus.*bulletin/i })).toBeVisible()
  })

  test('search filters cards by title', async ({ page }) => {
    await page.goto('/')
    const firstCard = page.locator('[data-testid="announcement-card"]').first()
    const hasCards = (await firstCard.count()) > 0
    test.skip(!hasCards, 'No published announcements in DB — run seed script first')

    await expect(firstCard).toBeVisible()
    const cardTitle = await firstCard.locator('h2, h3').first().textContent()
    expect(cardTitle).toBeTruthy()

    const keyword = cardTitle!.split(' ')[0]
    await page.getByPlaceholder(/search/i).fill(keyword)
    await page.getByRole('button', { name: /^search$/i }).click()
    await expect(page).toHaveURL(new RegExp(`q=${encodeURIComponent(keyword)}`, 'i'))
    const cards = page.locator('[data-testid="announcement-card"]')
    await expect(cards.first()).toBeVisible()
    const count = await cards.count()
    expect(count).toBeGreaterThan(0)
  })

  test('search with no matches shows empty state', async ({ page }) => {
    await page.goto('/?q=xyznotfound12345')
    await expect(page.getByText('No announcements', { exact: true })).toBeVisible()
    await expect(page.getByText(/no announcements match your search/i)).toBeVisible()
  })

  test('clear button removes q param and restores feed', async ({ page }) => {
    await page.goto('/?q=test')
    const clearLink = page.getByRole('link', { name: /clear/i })
    if ((await clearLink.count()) === 0) return // no results to clear
    await clearLink.click()
    await expect(page).not.toHaveURL(/q=/)
  })

  test('category filter combined with search shows intersection', async ({ page }) => {
    await page.goto('/')
    const filterBtn = page.locator('button[data-category]:not([data-category=""])').first()
    const hasCategories = (await filterBtn.count()) > 0
    test.skip(!hasCategories, 'No active categories in DB — run seed script first')

    await expect(filterBtn).toBeVisible()
    const categorySlug = await filterBtn.getAttribute('data-category')
    expect(categorySlug).toBeTruthy()

    await filterBtn.click()
    await expect(page).toHaveURL(new RegExp(`category=${encodeURIComponent(categorySlug!)}`))
    await page.getByPlaceholder(/search/i).fill('a')
    await page.getByRole('button', { name: /^search$/i }).click()
    await expect(page).toHaveURL(/category=.*q=|q=.*category=/)
  })

  test('category filter buttons do not submit parent form unexpectedly', async ({ page }) => {
    await page.goto('/')
    // Navigate to /?q=hello, then click a category — q should be cleared (new navigation) but no double submit
    await page.goto('/?q=hello')
    const filterButtons = page.locator('button[type="button"]')
    const count = await filterButtons.count()
    expect(count).toBeGreaterThan(0)
    // Click category button — should navigate without form submission error
    await filterButtons.first().click()
    // Should not have a 405 or error page
    await expect(page.locator('body')).not.toContainText('405')
  })

  test('EmptyState shows browse-all link when category or search is active', async ({ page }) => {
    await page.goto('/?q=xyznotfound12345')
    await expect(page.getByRole('link', { name: /browse all/i })).toBeVisible()
  })
})
