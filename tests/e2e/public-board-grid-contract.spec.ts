import { expect, type Page, test } from '@playwright/test'

type Box = {
  bottom: number
  clientWidth: number
  height: number
  right: number
  scrollWidth: number
  width: number
  x: number
  y: number
}

type Metrics = {
  announcementSection: Box | null
  documentWidth: number
  featuredCard: Box | null
  featuredSection: Box | null
  footer: Box | null
  header: Box | null
  hero: Box | null
  livePanel: Box | null
  overflowTargets: string[]
  pins: Box | null
  search: Box | null
  shell: Box | null
  sort: Box | null
  viewportWidth: number
}

const VIEWPORTS = [
  { name: 'desktop', width: 1366, height: 768, shellWidth: 1184, gap: 16, hasSideColumn: true },
  { name: 'laptop', width: 1280, height: 900, shellWidth: 1184, gap: 16, hasSideColumn: true },
  { name: 'tablet', width: 768, height: 1024, shellWidth: 728, gap: 16, hasSideColumn: false },
  { name: 'mobile', width: 375, height: 844, shellWidth: 343, gap: 12, hasSideColumn: false },
] as const

async function waitForPublicBoard(page: Page) {
  await page.goto('/')
  await page.waitForFunction(() => {
    const shell = document.querySelector('.public-board-frame.public-layout-inner')
    const featuredCard = document.querySelector(
      '.hero-poster-card [data-testid="announcement-card"]'
    )
    const announcementSection = document.querySelector('#announcements')

    return (
      shell &&
      featuredCard &&
      announcementSection &&
      shell.getBoundingClientRect().width > 0 &&
      featuredCard.getBoundingClientRect().height > 0
    )
  })
}

async function readMetrics(page: Page): Promise<Metrics> {
  return page.evaluate(() => {
    const box = (selector: string, contentBox = false): Box | null => {
      const element = document.querySelector<HTMLElement>(selector)
      if (!element) return null

      const rect = element.getBoundingClientRect()
      const style = getComputedStyle(element)
      if (style.display === 'none' || rect.width === 0 || rect.height === 0) return null

      const paddingLeft = contentBox ? Number.parseFloat(style.paddingLeft) || 0 : 0
      const paddingRight = contentBox ? Number.parseFloat(style.paddingRight) || 0 : 0
      const x = rect.left + paddingLeft
      const width = rect.width - paddingLeft - paddingRight

      return {
        bottom: rect.bottom,
        clientWidth: element.clientWidth,
        height: rect.height,
        right: x + width,
        scrollWidth: element.scrollWidth,
        width,
        x,
        y: rect.top,
      }
    }

    const overflowSelectors = [
      '.public-board-frame.public-layout-inner',
      '.public-board-toolbar',
      '.public-board-filter-inline nav',
      '.public-board-sort-bar',
      '.public-board-sort-bar nav',
      '.public-featured-grid',
      '.public-board-pins',
      '#announcements',
    ]

    return {
      announcementSection: box('#announcements'),
      documentWidth: document.documentElement.scrollWidth,
      featuredCard: box('.hero-poster-card [data-testid="announcement-card"]'),
      featuredSection: box('.public-featured-grid'),
      footer: box('footer .public-layout-inner', true),
      header: box('nav[aria-label="Public navigation"]', true),
      hero: box('.public-board-hero'),
      livePanel: box('.public-board-live-panel'),
      overflowTargets: overflowSelectors.filter((selector) => {
        const element = document.querySelector<HTMLElement>(selector)
        return element ? element.scrollWidth > element.clientWidth + 1 : false
      }),
      pins: box('.public-board-pins'),
      search: box('.public-board-toolbar'),
      shell: box('.public-board-frame.public-layout-inner', true),
      sort: box('.public-board-sort-bar'),
      viewportWidth: window.innerWidth,
    }
  })
}

function requiredBox(box: Box | null, label: string): Box {
  expect(box, `${label} should render`).not.toBeNull()
  return box as Box
}

function expectWithin(value: number, expected: number, tolerance: number, label: string) {
  expect(Math.abs(value - expected), label).toBeLessThanOrEqual(tolerance)
}

function expectAlignedToShell(box: Box, shell: Box, label: string) {
  expectWithin(box.x, shell.x, 1, `${label} x aligns with shell`)
  expectWithin(box.width, shell.width, 1, `${label} width matches shell`)
  expectWithin(box.right, shell.right, 1, `${label} right edge aligns with shell`)
}

test.describe('Public board shared grid contract', () => {
  for (const viewport of VIEWPORTS) {
    test(`aligns board sections on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await waitForPublicBoard(page)

      const metrics = await readMetrics(page)
      const shell = requiredBox(metrics.shell, `${viewport.name} shell`)
      const hero = requiredBox(metrics.hero, `${viewport.name} hero`)
      const search = requiredBox(metrics.search, `${viewport.name} search toolbar`)
      const sort = requiredBox(metrics.sort, `${viewport.name} sort bar`)
      const featuredSection = requiredBox(
        metrics.featuredSection,
        `${viewport.name} featured section`
      )
      const announcementSection = requiredBox(
        metrics.announcementSection,
        `${viewport.name} announcement grid`
      )
      const featuredCard = requiredBox(metrics.featuredCard, `${viewport.name} featured card`)

      expectWithin(shell.width, viewport.shellWidth, 1, `${viewport.name} shell width`)
      expectAlignedToShell(search, shell, `${viewport.name} search toolbar`)
      expectAlignedToShell(sort, shell, `${viewport.name} sort bar`)
      expectAlignedToShell(featuredSection, shell, `${viewport.name} featured section`)
      expectAlignedToShell(announcementSection, shell, `${viewport.name} announcement section`)

      if (metrics.header) {
        expectAlignedToShell(metrics.header, shell, `${viewport.name} header`)
      }
      if (metrics.footer) {
        expectAlignedToShell(metrics.footer, shell, `${viewport.name} footer`)
      }

      if (viewport.hasSideColumn) {
        const livePanel = requiredBox(metrics.livePanel, `${viewport.name} live board panel`)
        const pins = requiredBox(metrics.pins, `${viewport.name} priority rail`)
        const columnWidth = (shell.width - viewport.gap * 11) / 12
        const mainWidth = columnWidth * 8 + viewport.gap * 7
        const sideWidth = columnWidth * 4 + viewport.gap * 3
        const sideX = shell.x + mainWidth + viewport.gap

        expectWithin(hero.x, shell.x, 1, `${viewport.name} hero main x`)
        expectWithin(hero.width, mainWidth, 1, `${viewport.name} hero main width`)
        expectWithin(featuredCard.x, shell.x, 1, `${viewport.name} featured card main x`)
        expectWithin(featuredCard.width, mainWidth, 1, `${viewport.name} featured card main width`)
        expectWithin(livePanel.x, sideX, 1, `${viewport.name} live board side x`)
        expectWithin(livePanel.width, sideWidth, 1, `${viewport.name} live board side width`)
        expectWithin(pins.x, sideX, 1, `${viewport.name} priority rail side x`)
        expectWithin(pins.width, sideWidth, 1, `${viewport.name} priority rail side width`)
        expectWithin(
          featuredCard.y,
          pins.y,
          1,
          `${viewport.name} featured card and rail start together`
        )
        expectWithin(
          featuredCard.bottom,
          pins.bottom,
          4,
          `${viewport.name} featured card and rail bottom together`
        )
      } else {
        expectAlignedToShell(hero, shell, `${viewport.name} hero`)
        expectAlignedToShell(featuredCard, shell, `${viewport.name} featured card`)
      }

      if (viewport.name === 'mobile') {
        expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewportWidth)
        expect(metrics.overflowTargets).toEqual([])
      }
    })
  }
})
