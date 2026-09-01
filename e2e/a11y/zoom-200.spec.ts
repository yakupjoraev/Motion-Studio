import { type Page, expect, test } from '@playwright/test'

import { settled } from '../fixtures/settle'

/**
 * WCAG 1.4.10 Reflow, which is a viewport measurement rather than a zoom setting: 200 % zoom on a
 * 1280 px window is a 640 px viewport, and the criterion itself is written at 320 px. Both are
 * checked, because a layout that reflows at one can still clip at the other — ADR-298 measured that.
 */
const PUBLIC_ROUTES = [
  '/',
  '/blocks',
  '/blocks/hero-centered',
  '/docs',
  '/docs/accessibility',
] as const

const WIDTHS = [
  { label: '200 % zoom of a 1280 px window', width: 640 },
  { label: '320 px', width: 320 },
] as const

/** The document must not scroll sideways. One pixel of slack for sub-pixel layout rounding. */
const overflow = (page: Page): Promise<number> =>
  page.evaluate(() => {
    const root = document.documentElement

    return Math.max(
      root.scrollWidth - root.clientWidth,
      document.body.scrollWidth - root.clientWidth,
    )
  })

/**
 * Anything past the viewport that is not inside a scroller, named so a failure says where to look.
 * A filter row or a wide table that scrolls **itself** is how 1.4.10 is met, not a violation of it —
 * what the criterion forbids is the page scrolling sideways.
 */
const widest = (page: Page): Promise<readonly string[]> =>
  page.evaluate(() => {
    const limit = document.documentElement.clientWidth
    const inScroller = (element: HTMLElement): boolean => {
      for (let node = element.parentElement; node !== null; node = node.parentElement) {
        const overflowX = getComputedStyle(node).overflowX

        // `hidden` and `clip` cannot scroll the page either — they clip. Engines disagree on which
        // of the four a given scroller computes to, and all four contain their children.
        if (['auto', 'scroll', 'hidden', 'clip'].includes(overflowX)) {
          return true
        }
      }

      return false
    }

    return [...document.querySelectorAll<HTMLElement>('body *')]
      .filter(
        (element) => element.getBoundingClientRect().right > limit + 1 && !inScroller(element),
      )
      .slice(0, 5)
      .map((element) => `${element.tagName.toLowerCase()}.${element.className}`.slice(0, 120))
  })

for (const { label, width } of WIDTHS) {
  test.describe(`at ${label}`, () => {
    for (const route of PUBLIC_ROUTES) {
      test(`${route} reflows without a horizontal scrollbar`, async ({ browser }) => {
        const context = await browser.newContext({ viewport: { width, height: 512 } })
        const page = await context.newPage()

        await page.goto(route)
        // `.first()`: a detail page has two — its own, and the one inside the live preview, which
        // ACCESSIBILITY.md § Landing, gallery, docs says is not a violation.
        await page.getByRole('heading', { level: 1 }).first().waitFor()
        await settled(page)

        expect(await widest(page)).toEqual([])
        expect(await overflow(page)).toBeLessThanOrEqual(1)

        await page.close()
      })
    }
  })
}

/**
 * ACCESSIBILITY.md § Known limitations: the studio asks for 1024 px and directs to the gallery below
 * it. The notice is then the whole surface, so it is the thing that has to survive the zoom.
 */
test.describe('the studio below its minimum width', () => {
  test('shows a readable notice at 200 % zoom, with a working way out', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 640, height: 512 } })
    const page = await context.newPage()

    await page.goto('/studio')

    await expect(page.getByText('Motion Studio needs a wider screen.')).toBeVisible()

    expect(await overflow(page)).toBeLessThanOrEqual(1)

    const link = page.getByRole('link', { name: /Browse the block gallery/ })

    await expect(link).toBeVisible()
    await link.click()
    await expect(page).toHaveURL(/\/blocks/)

    await page.close()
  })
})
