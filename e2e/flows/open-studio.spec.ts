import { expect, test } from '@playwright/test'

/**
 * ADR-353 — what the landing page shows between the press and the studio.
 *
 * The defect this covers was not a slow route: it was a route that said nothing while it loaded, so a
 * press looked like a press that had missed. The wait is therefore made deliberate here rather than
 * measured — a fallback that only appears on a slow machine is a fallback nobody can test.
 */
const HOLD_MS = 1500

test.describe('opening the studio', () => {
  test('answers the press with the shell before the shell exists', async ({ page }) => {
    // Hold the route's own payload, not the chunks: this is the request the segment suspends on, and
    // holding `**/*` would also hold the fallback's stylesheet.
    await page.route(/\/studio(\?|$)/, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, HOLD_MS))
      await route.continue()
    })

    await page.goto('/')

    await page.getByRole('link', { name: 'Open the studio' }).first().click()

    /*
     * Whichever of the two fallbacks the router reaches first, the answer on screen is the same one —
     * which is the point of them sharing a component. The route's own fallback is the one that also
     * carries `aria-busy`, and it is absent once the shell has painted, so it is not asserted here:
     * the router prefetches `/studio` from the landing page and which fallback wins is its business.
     */
    await expect(page.getByTestId('canvas-placeholder')).toBeVisible()
    await expect(page.getByText('Opening the studio…')).toBeVisible()
    expect(await page.locator('[data-testid="canvas-root"]').count()).toBe(0)

    // And it is a fallback, not a destination: the studio replaces it.
    await expect(page.getByTestId('canvas-root')).toBeVisible({ timeout: 30_000 })
    await expect(page.getByTestId('canvas-placeholder')).toBeHidden()
  })
})
