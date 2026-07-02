import { expect, test } from '@playwright/test'

test.describe('Public zoom reflow', () => {
  test('renders the desktop public board at 100% without page-level zoom scaling', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/')
    await page.waitForFunction(() => {
      const heading = document.querySelector('#public-feed-title')
      const feedBoard = document.querySelector('#announcements .public-feed-card-board')
      const featuredMedia = document.querySelector('.hero-poster-card [data-card-media]')

      return (
        heading &&
        feedBoard &&
        featuredMedia &&
        heading.getBoundingClientRect().height > 0 &&
        feedBoard.getBoundingClientRect().width > 0
      )
    })

    const metrics = await page.evaluate(() => {
      const shell = document.querySelector('.public-site-shell')
      const nav = document.querySelector('nav[aria-label="Public navigation"]')
      const content = document.querySelector('#main-content > div')
      const heading = document.querySelector('#public-feed-title')
      const hero = document.querySelector('.public-board-hero')
      const livePanel = document.querySelector('.public-board-live-panel')
      const searchDock = document.querySelector('.mobile-search-dock')
      const featuredCard = document.querySelector(
        '.hero-poster-card [data-testid="announcement-card"]'
      )
      const featuredMedia = document.querySelector('.hero-poster-card [data-card-media]')
      const feedCard = document.querySelector(
        '#announcements [data-bento-tile="announcements"] [data-testid="announcement-card"]'
      )
      const feedBoard = document.querySelector('#announcements .public-feed-card-board')

      if (
        !shell ||
        !nav ||
        !content ||
        !heading ||
        !hero ||
        !livePanel ||
        !searchDock ||
        !featuredCard ||
        !featuredMedia
      ) {
        return null
      }

      const shellStyles = getComputedStyle(shell as HTMLElement)
      const navRect = nav.getBoundingClientRect()
      const contentRect = content.getBoundingClientRect()
      const headingRect = heading.getBoundingClientRect()
      const heroRect = hero.getBoundingClientRect()
      const livePanelRect = livePanel.getBoundingClientRect()
      const searchDockRect = searchDock.getBoundingClientRect()
      const featuredCardRect = featuredCard.getBoundingClientRect()
      const mediaRect = featuredMedia.getBoundingClientRect()
      const feedCardRect = feedCard?.getBoundingClientRect()
      const feedBoardStyles = feedBoard ? getComputedStyle(feedBoard) : null
      const featuredImage = featuredMedia.querySelector('img')

      return {
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
        pageZoom: shellStyles.zoom,
        pageTransform: shellStyles.transform,
        navWidth: navRect.width,
        contentWidth: contentRect.width,
        headingHeight: headingRect.height,
        heroHeight: heroRect.height,
        livePanelWidth: livePanelRect.width,
        featuredCardWidth: featuredCardRect.width,
        featuredMediaHeight: mediaRect.height,
        featuredImageFit: featuredImage ? getComputedStyle(featuredImage).objectFit : '',
        searchTop: searchDockRect.top,
        feedCardWidth: feedCardRect?.width ?? 0,
        feedColumnCount:
          feedBoardStyles?.gridTemplateColumns.split(' ').filter(Boolean).length ?? 0,
      }
    })

    if (!metrics) {
      throw new Error('Missing public page sizing targets')
    }

    expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewportWidth)
    expect(metrics.pageZoom === '1' || metrics.pageZoom === 'normal').toBe(true)
    expect(metrics.pageTransform).toBe('none')
    expect(metrics.navWidth).toBeLessThanOrEqual(1220)
    expect(metrics.contentWidth).toBeGreaterThanOrEqual(1160)
    expect(metrics.contentWidth).toBeLessThanOrEqual(1220)
    expect(metrics.headingHeight).toBeGreaterThanOrEqual(50)
    expect(metrics.headingHeight).toBeLessThanOrEqual(70)
    expect(metrics.heroHeight).toBeLessThanOrEqual(330)
    expect(metrics.livePanelWidth).toBeGreaterThanOrEqual(300)
    expect(metrics.livePanelWidth).toBeLessThanOrEqual(340)
    expect(metrics.featuredCardWidth).toBeLessThanOrEqual(700)
    expect(metrics.featuredMediaHeight).toBeLessThanOrEqual(330)
    expect(metrics.featuredImageFit).toBe('cover')
    expect(metrics.searchTop).toBeLessThanOrEqual(1080)
    expect(metrics.feedColumnCount).toBe(3)
    expect(metrics.feedCardWidth).toBeGreaterThanOrEqual(330)
    expect(metrics.feedCardWidth).toBeLessThanOrEqual(410)
  })

  test('adapts laptop, tablet, and mobile without horizontal overflow', async ({ page }) => {
    for (const target of [
      { width: 1366, height: 768, livePanelVisible: true, maxHeading: 64 },
      { width: 1024, height: 768, livePanelVisible: true, maxHeading: 64 },
      { width: 820, height: 1180, livePanelVisible: false, maxHeading: 56 },
      { width: 390, height: 844, livePanelVisible: false, maxHeading: 40 },
    ]) {
      await page.setViewportSize({ width: target.width, height: target.height })
      await page.goto('/')
      await page.waitForFunction(() => {
        const livePanel = document.querySelector('.public-board-live-panel')
        const searchDock = document.querySelector('.mobile-search-dock')
        const sortPanel = document.querySelector('.public-board-sort')

        return (
          livePanel &&
          searchDock &&
          sortPanel &&
          searchDock.getBoundingClientRect().width > 0 &&
          sortPanel.getBoundingClientRect().width > 0
        )
      })

      const metrics = await page.evaluate(() => {
        const content = document.querySelector('#main-content > div')
        const heading = document.querySelector('#public-feed-title')
        const hero = document.querySelector('.public-board-hero')
        const livePanel = document.querySelector('.public-board-live-panel')
        const searchDock = document.querySelector('.mobile-search-dock')
        const sortPanel = document.querySelector('.public-board-sort')
        const feedBoard = document.querySelector('#announcements .public-feed-card-board')
        if (!content || !heading || !hero || !livePanel || !searchDock || !sortPanel || !feedBoard)
          return null

        const contentRect = content.getBoundingClientRect()
        const heroRect = hero.getBoundingClientRect()
        const livePanelRect = livePanel.getBoundingClientRect()
        const searchRect = searchDock.getBoundingClientRect()
        const sortRect = sortPanel.getBoundingClientRect()
        const feedBoardStyles = getComputedStyle(feedBoard)

        return {
          documentWidth: document.documentElement.scrollWidth,
          viewportWidth: window.innerWidth,
          headingFontSize: Number.parseFloat(getComputedStyle(heading).fontSize),
          contentWidth: contentRect.width,
          heroWidth: heroRect.width,
          livePanelDisplay: getComputedStyle(livePanel).display,
          livePanelWidth: livePanelRect.width,
          heroTop: Math.round(heroRect.top),
          livePanelTop: Math.round(livePanelRect.top),
          searchWidth: searchRect.width,
          sortWidth: sortRect.width,
          feedColumnCount: feedBoardStyles.gridTemplateColumns.split(' ').filter(Boolean).length,
        }
      })

      if (!metrics) {
        throw new Error('Missing public responsive sizing targets')
      }

      expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewportWidth)
      expect(metrics.contentWidth).toBeLessThanOrEqual(metrics.viewportWidth)
      expect(metrics.heroWidth).toBeLessThanOrEqual(metrics.viewportWidth)
      expect(metrics.searchWidth).toBeLessThanOrEqual(metrics.viewportWidth)
      expect(metrics.sortWidth).toBeLessThanOrEqual(metrics.viewportWidth)
      expect(metrics.headingFontSize).toBeLessThanOrEqual(target.maxHeading)
      expect(metrics.feedColumnCount).toBe(target.width > 1024 ? 3 : target.width >= 640 ? 2 : 1)
      if (target.livePanelVisible) {
        expect(metrics.livePanelDisplay).not.toBe('none')
        expect(metrics.livePanelWidth).toBeGreaterThan(0)
        if (target.width < 1024) {
          expect(metrics.livePanelTop).toBeGreaterThan(metrics.heroTop)
        }
      } else {
        expect(metrics.livePanelDisplay).toBe('none')
      }
    }
  })

  test('keeps public announcement cards fixed and poster-proportioned on laptop widths', async ({
    page,
  }) => {
    for (const target of [
      { width: 1280, height: 900 },
      { width: 1366, height: 768 },
      { width: 1440, height: 1000 },
    ]) {
      await page.setViewportSize(target)
      await page.goto('/')
      await page.waitForFunction(() => {
        return (
          document.querySelectorAll(
            '#announcements .uniform-card-board [data-testid="announcement-card"]'
          ).length > 0
        )
      })

      const metrics = await page.evaluate(() => {
        const round = (value: number) => Math.round(value * 10) / 10
        const cards = [
          ...document.querySelectorAll<HTMLElement>(
            '#announcements .uniform-card-board [data-testid="announcement-card"]'
          ),
        ].filter((card) => {
          const rect = card.getBoundingClientRect()
          return rect.width > 0 && rect.height > 0
        })
        const imageCards = cards.filter((card) => card.dataset.hasImage === 'true')
        const textCards = cards.filter((card) => card.dataset.hasImage === 'false')
        const sizesFor = (items: HTMLElement[]) => [
          ...new Set(
            items.map((item) => {
              const rect = item.getBoundingClientRect()
              return `${round(rect.width)}x${round(rect.height)}`
            })
          ),
        ]
        const mediaHeights = [
          ...new Set(
            imageCards.map((card) => {
              const media = card.querySelector<HTMLElement>('[data-card-media]')
              return media ? round(media.getBoundingClientRect().height) : 0
            })
          ),
        ]
        const footerOffsets = cards
          .map((card) => {
            const footer = card.querySelector<HTMLElement>('.announcement-card-footer')
            if (!footer) return null
            return round(
              card.getBoundingClientRect().bottom - footer.getBoundingClientRect().bottom
            )
          })
          .filter((value): value is number => value !== null)
        const imageCardHeights = imageCards.map((card) =>
          round(card.getBoundingClientRect().height)
        )
        const imageBodyHeights = imageCards.map((card) => {
          const body = card.querySelector<HTMLElement>('.announcement-card-body')
          return body ? round(body.getBoundingClientRect().height) : 0
        })
        const imageMediaRatios = imageCards.map((card) => {
          const media = card.querySelector<HTMLElement>('[data-card-media]')
          return media
            ? round(media.getBoundingClientRect().height / card.getBoundingClientRect().height)
            : 0
        })
        const imageFits = [
          ...new Set(
            imageCards
              .map((card) => card.querySelector<HTMLImageElement>('[data-card-media] img'))
              .filter((image): image is HTMLImageElement => Boolean(image))
              .map((image) => getComputedStyle(image).objectFit)
          ),
        ]
        const boardColumns = [
          ...new Set(
            [...document.querySelectorAll<HTMLElement>('#announcements .uniform-card-board')].map(
              (board) =>
                getComputedStyle(board).gridTemplateColumns.split(' ').filter(Boolean).length
            )
          ),
        ]
        const overflowingCards = cards.filter((card) => {
          return (
            card.scrollHeight > card.clientHeight + 1 || card.scrollWidth > card.clientWidth + 1
          )
        }).length

        return {
          boardColumns,
          cardCount: cards.length,
          imageCardCount: imageCards.length,
          textCardCount: textCards.length,
          imageCardSizes: sizesFor(imageCards),
          textCardSizes: sizesFor(textCards),
          mediaHeights,
          imageCardHeights,
          imageBodyHeights,
          imageMediaRatios,
          imageFits,
          footerOffsets,
          overflowingCards,
        }
      })

      expect(metrics.boardColumns).toEqual([3])
      expect(metrics.cardCount).toBeGreaterThan(0)
      expect(metrics.imageCardCount).toBeGreaterThan(0)
      expect(metrics.textCardCount).toBeGreaterThan(0)
      expect(metrics.imageCardSizes).toHaveLength(1)
      expect(metrics.textCardSizes).toHaveLength(1)
      expect(metrics.mediaHeights.every((height) => height >= 229 && height <= 231)).toBe(true)
      expect(metrics.imageCardHeights.every((height) => height >= 575 && height <= 577)).toBe(true)
      expect(metrics.imageBodyHeights.every((height) => height >= 343 && height <= 345)).toBe(true)
      expect(metrics.imageMediaRatios.every((ratio) => ratio >= 0.39 && ratio <= 0.41)).toBe(true)
      expect(metrics.imageFits).toEqual(['cover'])
      expect(
        Math.max(...metrics.footerOffsets) - Math.min(...metrics.footerOffsets)
      ).toBeLessThanOrEqual(2)
      expect(metrics.overflowingCards).toBe(0)
    }
  })

  test('does not pin public chrome over announcement cards while scrolling', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 })
    await page.goto('/')

    const firstCard = page
      .locator('#announcements [data-bento-tile="announcements"] [data-testid="announcement-card"]')
      .first()
    await expect(firstCard).toBeVisible()
    await firstCard.scrollIntoViewIfNeeded()

    const metrics = await page.evaluate(() => {
      const header = document.querySelector('header')
      const searchDock = document.querySelector('.mobile-search-dock')
      const card = document.querySelector(
        '#announcements [data-bento-tile="announcements"] [data-testid="announcement-card"]'
      )

      if (!header || !searchDock || !card) return null

      const headerRect = header.getBoundingClientRect()
      const cardRect = card.getBoundingClientRect()

      return {
        headerBottom: Math.round(headerRect.bottom),
        cardTop: Math.round(cardRect.top),
        searchPosition: getComputedStyle(searchDock).position,
      }
    })

    if (!metrics) {
      throw new Error('Missing public chrome overlap targets')
    }

    expect(metrics.headerBottom <= 0 || metrics.headerBottom <= metrics.cardTop).toBe(true)
    expect(metrics.searchPosition).not.toBe('sticky')
  })

  test('keeps header controls usable at 320px zoom-equivalent width', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 })
    await page.goto('/')

    const nav = page.getByRole('navigation', { name: 'Public navigation' })
    const themeSwitch = page.getByRole('switch', { name: /theme:/i })
    const signIn = page.getByRole('link', { name: /sign in/i })

    await expect(nav).toBeVisible()
    await expect(themeSwitch).toBeVisible()
    await expect(signIn).toBeVisible()

    const metrics = await page.evaluate(() => {
      const nav = document.querySelector('nav[aria-label="Public navigation"]')
      const themeSwitch = document.querySelector('[role="switch"]')
      if (!nav || !themeSwitch) return null

      const navRect = nav.getBoundingClientRect()
      const switchRect = themeSwitch.getBoundingClientRect()

      return {
        navLeft: navRect.left,
        navRight: navRect.right,
        switchWidth: switchRect.width,
        viewportWidth: window.innerWidth,
      }
    })

    if (!metrics) {
      throw new Error('Missing public navigation or theme switch')
    }

    expect(metrics.navLeft).toBeGreaterThanOrEqual(0)
    expect(metrics.navRight).toBeLessThanOrEqual(metrics.viewportWidth)
    expect(metrics.switchWidth).toBeLessThanOrEqual(48)
  })
})
