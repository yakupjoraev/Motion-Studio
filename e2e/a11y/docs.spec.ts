import AxeBuilder from '@axe-core/playwright'
import { type Browser, type Page, expect, test } from '@playwright/test'

/**
 * `pnpm test:e2e:a11y` — ACCESSIBILITY.md § Landing, gallery, docs. The docs are checked in both
 * colour modes and at 320 px as well as 1440, for the reason ADR-298 records: a region that scrolls
 * at one width does not scroll at the other, and this route is made of scrolling regions.
 */
const scan = async (page: Page) =>
  new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()

/**
 * The theme is applied after the first paint, so `body`'s inherited colour moves from one value to
 * another within the first frames — measured on `/docs` and on `/blocks` alike. axe reads computed
 * colours, so a scan that starts inside that window reports the intermediate value as a contrast
 * failure. Waiting for the boot to settle is what makes the scan measure the page rather than its
 * first frame.
 */
const settle = async (page: Page): Promise<void> => {
  await page.getByRole('heading', { level: 1 }).waitFor()
  await page.waitForFunction(() => document.documentElement.hasAttribute('data-theme-ready'))
  await page.waitForTimeout(250)
}

/**
 * The server's HTML in a stored colour mode, with the app's chunks blocked.
 *
 * Blocking them is what makes the state well defined. `ThemeBoot` applies `studioDark` on mount
 * whatever the stored mode says, writing one CSS variable at a time, so a hydrated page whose reader
 * asked for light passes through a window where half the palette is dark — a window a scan under load
 * lands in. That is a defect in the boot, not in this route, and it is reported as one; what this
 * route owes is HTML that is correct in both modes, which is what these scans measure.
 */
const openInMode = async (browser: Browser, mode: 'dark' | 'light', path: string) => {
  const context = await browser.newContext()

  await context.addInitScript(
    ([key, value]) => window.localStorage.setItem(key as string, value as string),
    ['ms-color-mode', mode],
  )

  const page = await context.newPage()

  await page.route('**/_next/static/chunks/**', (route) => route.abort())
  await page.goto(path, { waitUntil: 'domcontentloaded' })
  await page.getByRole('heading', { level: 1 }).waitFor()

  return { context, page }
}

const openNarrow = async (browser: Browser, path: string) => {
  const context = await browser.newContext({ viewport: { width: 320, height: 720 } })
  const page = await context.newPage()

  await page.goto(path)
  await settle(page)

  return { context, page }
}

test.describe('the documentation site', () => {
  test('has no axe violations once the page has settled', async ({ page }) => {
    await page.goto('/docs')
    await settle(page)

    expect((await scan(page)).violations).toEqual([])
  })

  test('has no axe violations on the heaviest page once it has settled', async ({ page }) => {
    await page.goto('/docs/architecture')
    await settle(page)

    expect((await scan(page)).violations).toEqual([])
  })

  for (const mode of ['dark', 'light'] as const) {
    for (const path of ['/docs', '/docs/architecture']) {
      test(`sends HTML with no axe violations in ${mode} mode: ${path}`, async ({ browser }) => {
        const { context, page } = await openInMode(browser, mode, path)

        expect((await scan(page)).violations).toEqual([])

        await context.close()
      })
    }
  }

  test('has no axe violations at 320 px, and the code fences stay reachable', async ({
    browser,
  }) => {
    const { context, page } = await openNarrow(browser, '/docs/devops')

    expect((await scan(page)).violations).toEqual([])

    const fence = page.getByTestId('docs-code').first()
    await fence.focus()
    await expect(fence).toBeFocused()

    await context.close()
  })

  test('does not scroll the page sideways at 320 px, whatever the tables do', async ({
    browser,
  }) => {
    const { context, page } = await openNarrow(browser, '/docs/tech-stack')

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )

    expect(overflow).toBeLessThanOrEqual(1)

    await context.close()
  })

  test.describe('its keyboard path', () => {
    /*
     * Safari's default keyboard access leaves links out of the tab order — "Press Tab to highlight each
     * item" is off until a user turns it on, and Playwright's WebKit follows that default. The skip link
     * is a link, so on that engine this asserts a platform setting rather than the page (ADR-329).
     */
    test.skip(({ browserName }) => browserName === 'webkit', 'Tab does not reach links in WebKit')

    test('puts the skip link first and lands it on the article', async ({ page }) => {
      await page.goto('/docs/canvas')
      await page.keyboard.press('Tab')

      const skip = page.getByRole('link', { name: 'Skip to content' })
      await expect(skip).toBeFocused()

      await page.keyboard.press('Enter')
      await expect(page.locator('#main')).toBeVisible()
    })
  })

  test('reads sidebar, then article, then table of contents', async ({ page }) => {
    await page.goto('/docs/canvas')

    const order = await page.evaluate(() => {
      const stops = [...document.querySelectorAll('a, button, [tabindex="0"], summary')]

      const positionOf = (selector: string): number =>
        stops.findIndex((stop) => stop.closest(selector) !== null)

      return {
        sidebar: positionOf('nav[aria-label="Documentation"]'),
        main: positionOf('#main'),
        toc: positionOf('nav[aria-label="On this page"]'),
      }
    })

    expect(order.sidebar).toBeLessThan(order.main)
    expect(order.main).toBeLessThan(order.toc)
  })

  test('marks the current page in the nav with JavaScript blocked', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()

    await page.goto('/docs/canvas')

    await expect(page.getByRole('link', { name: 'CANVAS.md' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await expect(page.getByRole('table').first()).toBeVisible()

    await context.close()
  })

  test('resolves an anchor pasted fresh into the address bar', async ({ page }) => {
    await page.goto('/docs/accessibility#reduced-motion')

    const heading = page.locator('#reduced-motion')
    await expect(heading).toBeVisible()

    const top = await heading.evaluate((element) => element.getBoundingClientRect().top)

    expect(top).toBeLessThan(200)
  })

  test('tracks the table of contents against the scroll position', async ({ page }) => {
    await page.goto('/docs/canvas')

    const toc = page.getByRole('navigation', { name: 'On this page' })
    const target = toc.getByRole('link').nth(3)

    // Following the link is what puts the heading under the sticky header, which is the position the
    // observer's band is defined around. `scrollIntoViewIfNeeded` leaves it at the bottom instead.
    await target.click()
    await page.waitForTimeout(400)

    await expect(target).toHaveAttribute('aria-current', 'true')
    await expect(toc.getByRole('link').first()).not.toHaveAttribute('aria-current', 'true')
  })
})

test.describe('searching the documentation', () => {
  test('loads the index on the first ⌘K and not before', async ({ page }) => {
    const requests: string[] = []

    page.on('request', (request) => requests.push(request.url()))

    await page.goto('/docs/canvas')
    await page.getByRole('heading', { level: 1 }).waitFor()
    await page.waitForTimeout(500)

    expect(requests.filter((url) => url.includes('docs-search-index.json'))).toHaveLength(0)

    await page.keyboard.press('ControlOrMeta+k')
    await page.getByTestId('docs-search-input').waitFor()

    // The dialog fetches on mount, so the request is already in flight by the time the field exists.
    await expect
      .poll(() => requests.filter((url) => url.includes('docs-search-index.json')).length)
      .toBe(1)
  })

  test('finds a section in another document and navigates to it', async ({ page }) => {
    await page.goto('/docs')
    await page.getByTestId('docs-search-trigger').click()

    const input = page.getByTestId('docs-search-input')
    await input.fill('drop position')

    const first = page.getByTestId('docs-search-option').first()
    await expect(first).toContainText('Drop position resolution')

    await input.press('Enter')

    await expect(page).toHaveURL(/\/docs\/drag-and-drop#drop-position-resolution$/)
  })

  test('has no axe violations while the search is open', async ({ page }) => {
    await page.goto('/docs')
    await settle(page)
    await page.getByTestId('docs-search-trigger').click()
    await page.getByTestId('docs-search-input').waitFor()
    await page.waitForTimeout(300)

    expect((await scan(page)).violations).toEqual([])
  })
})
