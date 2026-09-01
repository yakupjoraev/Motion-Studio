import { type Page, expect, test } from '@playwright/test'

import { StudioPage } from '../fixtures/studio-page'

import { settled } from '../fixtures/settle'

/**
 * ACCESSIBILITY.md § Reduced motion, over every route. `e2e/perf/reduced-motion-off.spec.ts` makes
 * the same two assertions about the canvas; this is the public half, where the animations are
 * entrances and scroll reveals — and where the classic bug lives: not an animation that survives,
 * but content that never appears because the reveal meant to show it was disabled.
 */
const ROUTES = ['/', '/blocks', '/blocks/hero-centered', '/docs', '/playground'] as const

/** Keyframes that would move something. Under reduced motion there must be none, anywhere. */
const transformKeyframes = (page: Page): Promise<number> =>
  page.evaluate(
    () =>
      document
        .getAnimations()
        .flatMap((animation) =>
          animation.effect instanceof KeyframeEffect ? animation.effect.getKeyframes() : [],
        )
        .filter((frame) => 'transform' in frame || 'translate' in frame || 'scale' in frame).length,
  )

/**
 * Content that is in the layout and cannot be read. Elements with no box are not this — a collapsed
 * section or a filtered-out card was never revealed by an animation. Neither are controls that rest
 * at opacity 0 and appear on hover **or focus**, which the last test here is about.
 */
const unreadable = (page: Page): Promise<readonly string[]> =>
  page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('main :is(h1,h2,h3,h4,p,li,figcaption,td,th)')]
      .filter((element) => {
        const style = getComputedStyle(element)
        const box = element.getBoundingClientRect()

        if (box.height === 0 || box.width === 0 || style.display === 'none') {
          return false
        }

        return Number(style.opacity) < 0.99 || style.visibility === 'hidden'
      })
      .slice(0, 6)
      .map((element) => `${element.tagName.toLowerCase()}: ${element.textContent?.slice(0, 40)}`),
  )

/** The islands and the scroll reveals are behind observers, so the page has to be walked to wake them. */
const walk = async (page: Page): Promise<void> => {
  await page.evaluate(async () => {
    const step = window.innerHeight

    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y)
      await new Promise((resolve) => {
        setTimeout(resolve, 120)
      })
    }

    window.scrollTo(0, 0)
  })
  await settled(page)
}

for (const route of ROUTES) {
  test.describe(`${route} under reduced motion`, () => {
    test('runs no transform animation and leaves every line readable', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto(route)
      await page.getByRole('heading', { level: 1 }).first().waitFor()
      await walk(page)

      expect(await transformKeyframes(page)).toBe(0)
      expect(await unreadable(page)).toEqual([])
    })
  })
}

/**
 * ACCESSIBILITY.md § Non-negotiables, 10: nothing depends on hover alone. The docs' heading anchors
 * rest at opacity 0 and are revealed by `group-hover:` and `focus-visible:` together — measured
 * rather than read off the class list, because a `group-hover:` without its twin is exactly the kind
 * of pair that survives review.
 *
 * Tabbed rather than focused: `element.focus()` does not match `:focus-visible` in Chrome, and
 * `CSS.forcePseudoState` over CDP did not either — both measure the resting style and would call a
 * missing reveal a pass.
 */
test.describe('controls that rest hidden', () => {
  /*
   * Safari's default keyboard access takes links out of the tab order — "Press Tab to highlight each
   * item" is off unless the user turns it on, and Playwright's WebKit follows that default. The anchor
   * this test walks to is a link, so on WebKit there is nothing to walk to and nothing to assert.
   */
  test.skip(({ browserName }) => browserName === 'webkit', 'Tab does not reach links in WebKit')

  test('are revealed by the focus state, not by hover alone', async ({ page }) => {
    await page.goto('/docs/accessibility')
    await page.getByRole('heading', { level: 1 }).first().waitFor()

    expect(await page.locator('main a.opacity-0').count()).toBeGreaterThan(0)

    let reached = false

    for (let press = 0; press < 80 && !reached; press += 1) {
      await page.keyboard.press('Tab')
      reached = await page.evaluate(
        () => document.activeElement?.matches('main a.opacity-0') ?? false,
      )
    }

    expect(reached, 'a heading anchor is reachable by Tab').toBe(true)

    // Polled, not read once: the reveal is a transition, so an immediate read catches it at 0.
    await expect
      .poll(() =>
        page.evaluate(() =>
          document.activeElement === null
            ? 0
            : Number(getComputedStyle(document.activeElement).opacity),
        ),
      )
      .toBeGreaterThan(0.99)
  })
})

test.describe('the studio under reduced motion', () => {
  test('is operable and announces the same things', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })

    const studio = new StudioPage(page)

    await studio.open('responsive-grid')
    await studio.selectLayer('node_f002')

    await expect(page.getByTestId('status-selection')).not.toHaveText('No selection')
    expect(await transformKeyframes(page)).toBe(0)
  })
})
