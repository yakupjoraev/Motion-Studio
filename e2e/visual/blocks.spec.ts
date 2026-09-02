import { expect, test } from '@playwright/test'

import { previewableBlocks, readyForShot, storyUrl } from '../fixtures/storybook'

/**
 * Every block in the registry, light and dark — TESTING.md § Visual regression.
 *
 * **What this suite is for.** A token change that quietly breaks forty blocks becomes one failing job
 * instead of a discovery three weeks later. That is the whole yield, and it is why the scope is this
 * narrow and no narrower.
 *
 * **What is deliberately out, and must stay out:**
 *
 * - **Full pages.** Too much surface, and they change for reasons that are not visual regressions.
 * - **Anything mid-animation.** Reduced motion is forced for every shot; a suite that screenshots a
 *   transition is a suite that fails at random and teaches people to re-run it.
 * - **Anything with a date, a random value, or third-party content.** Every block here renders its
 *   own `previewProps` — a fixture, by construction.
 * - **The landing page.** Its whole point is motion, so a still of it asserts the least interesting
 *   thing about it and breaks whenever the motion is tuned.
 *
 * Expanding this list is how visual suites become unreliable, and an unreliable visual suite protects
 * nothing while costing a job on every push.
 */
const BLOCKS = previewableBlocks()

const MODES = ['light', 'dark'] as const

test.describe('every block, in both colour modes', () => {
  test.beforeAll(() => {
    // A guard rather than a comment: the count is the registry's, so a definition that stops
    // declaring `previewProps` shows up here instead of silently leaving the suite.
    expect(BLOCKS.length).toBeGreaterThan(60)
  })

  for (const mode of MODES) {
    for (const blockId of BLOCKS) {
      test(`${blockId} in ${mode}`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: mode, reducedMotion: 'reduce' })
        await page.goto(
          storyUrl('thumbnail-block--preview', {
            mode,
            theme: mode === 'dark' ? 'studio-dark' : 'studio-light',
            args: `blockId:${blockId}`,
          }),
        )

        // The block's own root, not the stage's: `code-block` and `video` are lazy, and the stage is
        // painted before they arrive — a shot taken on the wrapper catches the Suspense hole.
        //
        // Attached rather than visible: a layout block's `previewProps` fill no slots, so `columns`
        // and its kind render a container of zero height. That is what the catalogue shows for them
        // too, and a baseline of it still watches the stage they are drawn on.
        const stage = page.locator(`[data-thumbnail-ready="${blockId}"] > div > *`).first()

        await stage.waitFor({ state: 'attached', timeout: 30_000 })
        await readyForShot(page)

        await expect(page).toHaveScreenshot(`${blockId}-${mode}.png`, { fullPage: false })
      })
    }
  }
})
