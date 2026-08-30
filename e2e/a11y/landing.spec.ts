import AxeBuilder from '@axe-core/playwright'
import { type Page, expect, test } from '@playwright/test'

/**
 * `pnpm test:e2e:a11y` — ACCESSIBILITY.md § Gates: zero violations on every public surface, and the
 * keyboard path walked rather than assumed.
 *
 * The page is checked in three states, because it has three: the one the server sends, the one the
 * islands upgrade it to, and the one a visitor who asked for less motion gets. A page that is
 * accessible in one of the three is accessible in none of them.
 */
const scan = async (page: Page) =>
  new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()

const open = async (page: Page): Promise<void> => {
  await page.goto('/')
  await page.getByRole('heading', { level: 1 }).waitFor()
}

test.describe('the landing page', () => {
  test('has no axe violations once the islands have mounted', async ({ page }) => {
    await open(page)
    // Every island is behind an observer, so the scan has to walk the page to wake them.
    await page.getByRole('contentinfo').scrollIntoViewIfNeeded()
    await page.waitForTimeout(1500)

    expect((await scan(page)).violations).toEqual([])
  })

  test('has no axe violations in the HTML the server sends', async ({ page }) => {
    /*
     * The application's chunks are blocked rather than JavaScript disabled: axe runs *in* the page,
     * so a context with no JavaScript cannot be scanned at all. Blocking React's chunks leaves the
     * server's HTML unhydrated, which is the state this test is about.
     */
    await page.route('**/_next/static/chunks/**', (route) => route.abort())
    await page.goto('/')
    await page.getByRole('heading', { level: 1 }).waitFor()

    expect((await scan(page)).violations).toEqual([])
  })

  test('has no axe violations under reduced motion', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' })
    const page = await context.newPage()

    await open(page)
    await page.getByRole('contentinfo').scrollIntoViewIfNeeded()
    await page.waitForTimeout(1500)

    expect((await scan(page)).violations).toEqual([])

    await context.close()
  })

  test('has no axe violations at 320 px, and reaches the code block from the keyboard', async ({
    browser,
  }) => {
    /*
     * The suite ran at 1440 px only, and a whole class of defect lives below that width: a region
     * that scrolls at 320 px does not scroll at 1440 px, so it is not a scrollable region there and
     * axe has nothing to complain about. The export sample was exactly that — ADR-298.
     */
    const context = await browser.newContext({ viewport: { width: 320, height: 720 } })
    const page = await context.newPage()

    await open(page)
    await page.getByRole('contentinfo').scrollIntoViewIfNeeded()
    await page.waitForTimeout(1500)

    expect((await scan(page)).violations).toEqual([])

    const code = page.getByRole('region', { name: /\.tsx$/i })
    await code.focus()
    await expect(code).toBeFocused()

    await context.close()
  })

  test('names each band of the page by its heading, not by its rail coordinate', async ({
    page,
  }) => {
    await open(page)

    // A reader moving by landmark hears the subject first; the coordinate is the second half.
    for (const [id, heading] of [
      ['problem', 'Two kinds of tools'],
      ['effects', 'Every effect is a component'],
      ['inspector', 'Change a value'],
      ['export', 'The export is the component'],
      ['architecture', 'Seventeen packages'],
      ['stack', 'The stack, with the actual reasons'],
    ] as const) {
      await expect(page.locator(`#${id}`), `#${id} is named by its heading`).toHaveAccessibleName(
        new RegExp(`^${heading}`),
      )
    }
  })

  test('starts its keyboard path at the skip link', async ({ page }) => {
    await open(page)
    await page.keyboard.press('Tab')

    await expect(page.locator(':focus')).toHaveText('Skip to content')
  })

  test('reaches the hero demo with the keyboard and moves it with the arrow keys', async ({
    page,
  }) => {
    await open(page)
    await page.waitForTimeout(1500)

    const node = page.getByRole('button', { name: /Hero block/ })

    await node.focus()

    const before = await page.getByRole('figure').first().textContent()

    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')

    // The readout under the frame is the node's position, so it is the proof that the key landed.
    await expect(page.getByRole('figure').first()).not.toHaveText(before ?? '')
  })

  test('is readable with no JavaScript: every section, and the demo as a static node', async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()

    await page.goto('/')

    for (const id of [
      'hero',
      'problem',
      'effects',
      'inspector',
      'export',
      'architecture',
      'stack',
    ]) {
      await expect(page.locator(`#${id}`), `#${id} is in the HTML`).toBeVisible()
    }

    await expect(page.getByText('Interactive demo — open the studio')).toBeVisible()
    // The export sample is generated at build time, so it is in the HTML rather than fetched.
    await expect(page.getByText("'use client'").first()).toBeVisible()

    await context.close()
  })

  test('leaves nothing invisible under reduced motion', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' })
    const page = await context.newPage()

    await open(page)
    await page.getByRole('contentinfo').scrollIntoViewIfNeeded()
    await page.waitForTimeout(1500)

    /*
     * `prompts/51`: "Nothing at opacity 0 waiting for an entrance." Anything a scroll trigger would
     * have revealed is either painted or is a decorative layer, and a decorative layer is
     * `aria-hidden`.
     */
    const hidden = await page.evaluate(() =>
      [...document.querySelectorAll('main *')]
        .filter((element) => {
          const style = getComputedStyle(element)

          return (
            (style.opacity === '0' || style.visibility === 'hidden') &&
            element.getAttribute('aria-hidden') !== 'true' &&
            (element.textContent ?? '').trim().length > 0
          )
        })
        .map((element) => element.className.slice(0, 60)),
    )

    expect(hidden).toEqual([])

    await context.close()
  })
})
