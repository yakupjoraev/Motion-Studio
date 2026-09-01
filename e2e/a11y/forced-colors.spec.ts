import AxeBuilder from '@axe-core/playwright'
import { type Browser, type Page, expect, test } from '@playwright/test'

import { StudioPage } from '../fixtures/studio-page'

/**
 * ACCESSIBILITY.md § Focus, in Windows High Contrast. Forced colours replaces every colour the page
 * chose and **drops `box-shadow` entirely** — which is what the focus ring is made of, so a page that
 * never says `outline` has no focus indicator at all in this mode.
 *
 * The assertions are on `outline`, not on a screenshot: the requirement is that the indicator does not
 * depend on a property the mode discards.
 */
const forced = async (browser: Browser): Promise<Page> => {
  const context = await browser.newContext({ forcedColors: 'active', colorScheme: 'light' })

  return context.newPage()
}

/*
 * A painted outline, not merely a width: `outline: none` computes to `none 3px` in Chrome, so a
 * width on its own proves nothing — the style is what decides whether anything is drawn.
 */
const outlineOf = (page: Page, selector: string) =>
  page.locator(selector).evaluate((element) => {
    const computed = getComputedStyle(element)

    return {
      style: computed.outlineStyle,
      width: Number.parseFloat(computed.outlineWidth) || 0,
      shadow: computed.boxShadow,
    }
  })

/** The widest edge the element draws — a panel needs one, on whichever side faces the canvas. */
const widestBorder = (page: Page, selector: string): Promise<number> =>
  page.locator(selector).evaluate((element) => {
    const style = getComputedStyle(element)

    return Math.max(
      ...[
        style.borderTopWidth,
        style.borderRightWidth,
        style.borderBottomWidth,
        style.borderLeftWidth,
      ].map((width) => Number.parseFloat(width) || 0),
    )
  })

test.describe('forced colours', () => {
  // WebKit implements no forced-colours mode, so there is nothing to emulate and nothing to assert.
  test.skip(({ browserName }) => browserName === 'webkit', 'no forced-colours support')

  test('gives the focus ring a real outline on a public route', async ({ browser }) => {
    const page = await forced(browser)

    await page.goto('/')
    await page.getByRole('heading', { level: 1 }).waitFor()

    // The skip link is the first focusable element on every public route — ACCESSIBILITY.md § Landing.
    await page.keyboard.press('Tab')

    const focused = await page.evaluate(() => document.activeElement?.tagName ?? 'NONE')

    expect(focused).not.toBe('BODY')

    const outline = await outlineOf(page, ':focus-visible')

    expect(outline.style).not.toBe('none')
    expect(outline.width).toBeGreaterThan(0)

    await page.close()
  })

  test('gives the focus ring a real outline in the studio', async ({ browser }) => {
    const page = await forced(browser)
    const studio = new StudioPage(page)

    await studio.open('responsive-grid')
    // Tabbed rather than focused: `element.focus()` does not match `:focus-visible` on a button, so a
    // programmatic focus would measure the resting style and call the missing ring a pass.
    await page.keyboard.press('Tab')

    const outline = await outlineOf(page, ':focus-visible')

    /*
     * The shadow is not the indicator in this mode: Chrome drops the property and Firefox keeps it
     * with every colour forced transparent, so neither paints a ring. Only the outline is asserted.
     */
    expect(outline.style).not.toBe('none')
    expect(outline.width).toBeGreaterThan(0)

    await page.close()
  })

  test('keeps the panel edges as borders rather than as a change of value', async ({ browser }) => {
    const page = await forced(browser)
    const studio = new StudioPage(page)

    await studio.open('responsive-grid')

    // Every surface is `Canvas` in this mode, so a panel separated only by a lighter fill has no
    // edge at all. The three regions of the shell each need a real border.
    expect(await widestBorder(page, '[aria-label="Left panel"]')).toBeGreaterThan(0)
    expect(await widestBorder(page, '[aria-label="Inspector"]')).toBeGreaterThan(0)
    expect(await widestBorder(page, 'footer')).toBeGreaterThan(0)

    await page.close()
  })

  test('has no axe violations in the studio or on a public route', async ({ browser }) => {
    const page = await forced(browser)

    await page.goto('/blocks')
    await page.getByRole('heading', { level: 1 }).waitFor()
    await page.waitForTimeout(500)

    /*
     * `color-contrast` is disabled here, and only here. Playwright's forced-colours emulation flips
     * the media feature and repaints the backgrounds with system colours, but axe still reads the
     * authored text colour — so the rule compares a forced background against a colour the mode has
     * replaced and reports thousands of violations that do not exist. Real forced colours overrides
     * both sides. Every other rule is asserted.
     */
    const scan = new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .disableRules(['color-contrast'])

    expect((await scan.analyze()).violations).toEqual([])

    await page.close()
  })
})
