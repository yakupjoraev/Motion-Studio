import { type Page, expect, test } from '@playwright/test'

import { settled } from '../fixtures/settle'

/**
 * ADR-353 — what the landing page shows between the press and the studio.
 *
 * The defect this covers was not a slow route: it was a route that said nothing while it loaded, so a
 * press looked like a press that had missed. The wait is therefore made deliberate here rather than
 * measured — a fallback that only appears on a slow machine is a fallback nobody can test.
 */
const HOLD_MS = 1500

/**
 * Hold the route's own payload, not the chunks: this is the request the segment suspends on, and
 * holding every request would also hold the fallback's own stylesheet.
 */
const holdStudio = async (page: Page): Promise<void> => {
  await page.route(/\/studio(\?|$)/, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, HOLD_MS))
    await route.continue()
  })
}

test.describe('opening the studio', () => {
  test('answers the press while the route is still in flight', async ({ page }) => {
    await holdStudio(page)
    await page.goto('/')

    /*
     * The press has to be a *client* navigation, and that is a state rather than a delay: an
     * un-hydrated page follows the link as a document request, the browser owns the wait, and the
     * assertion below would be reporting how loaded the runner was. The hero's card is an island, so
     * it standing there is React having run, and `settled` is the network quiet on top of that.
     *
     * The spec asserted the route's own fallback instead, and failed in CI while passing locally for
     * exactly this reason — ADR-280: a gate that only holds on one machine is measuring the machine.
     */
    await page.getByRole('button', { name: /Hero block/ }).waitFor()
    await settled(page)

    await page.getByRole('link', { name: 'Open the studio' }).first().click()

    /*
     * The answer is the rule on the link — `nav-link.tsx`. Nothing on this page prefetches, so at
     * this point the router has not committed and `loading.tsx` has not rendered: measured at 62 ms
     * after the press, against 1 699 ms for the route's own fallback.
     */
    await expect(page.getByTestId('nav-pending')).toBeVisible()

    // And it is an answer, not the destination: the shell is not there while the rule is.
    expect(await page.locator('[data-testid="canvas-root"]').count()).toBe(0)

    await expect(page.getByTestId('canvas-root')).toBeVisible({ timeout: 30_000 })
    await expect(page.getByTestId('nav-pending')).toHaveCount(0)
  })

  test('waits in the shell’s own frame rather than in an empty one', async ({ page }) => {
    /*
     * The other half of ADR-353: the visitor who arrives at `/studio` directly. The frame is the
     * shell's grid rather than a spinner, so the layout waited in is the layout that arrives —
     * measured at 1 641 ms for the frame and 2 034 ms for the canvas with the payload held.
     */
    await holdStudio(page)
    await page.goto('/studio')

    /*
     * One assertion for both halves of the frame, because they are one state and it is short.
     * Measured on the CI trace of 2026-09-19: the placeholder resolved at 1.83 s and the studio had
     * replaced it by 2.16 s, so the second `toBeVisible` spent its whole timeout looking for a node
     * that no longer existed while the first had just passed. The component renders the skeleton and
     * the wording together — asking for them separately is asking twice about one frame (ADR-408).
     */
    await expect(
      page.getByTestId('canvas-placeholder').filter({ hasText: 'Opening the studio…' }).first(),
    ).toBeVisible()

    await expect(page.getByTestId('canvas-root')).toBeVisible({ timeout: 30_000 })
    await expect(page.getByTestId('canvas-placeholder').first()).toBeHidden()
  })
})
