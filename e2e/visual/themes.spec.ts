import { expect, test } from '@playwright/test'

import { readyForShot, storyUrl, themePresets } from '../fixtures/storybook'

/**
 * The ten shipped presets, on one block — THEME_ENGINE.md § Presets.
 *
 * One reference block rather than ten blocks per preset: what is being tested is the theme, and a
 * theme shows itself in surfaces, text, accent and radius. A block that carries all four is a
 * sufficient witness, and a hundred shots of the same tokens would only be slower to review.
 *
 * `pricing-table` is the witness: three surfaces at different elevations, body text on each, an
 * accent-filled button, a border, and rounded corners at two scales.
 */
const REFERENCE_BLOCK = 'pricing-table'

const PRESETS = themePresets()

test.describe('the shipped theme presets', () => {
  test.beforeAll(() => {
    // THEME_ENGINE.md § Presets ships ten. A preset added without a shot would go unreviewed, and a
    // preset removed would leave a baseline nothing writes to.
    expect(PRESETS).toHaveLength(10)
  })

  for (const preset of PRESETS) {
    test(`${preset} on ${REFERENCE_BLOCK}`, async ({ page }) => {
      /*
       * The colour mode follows the preset rather than the other way round: `paper` and `studio-light`
       * are light themes, and painting them under a dark `prefers-color-scheme` would screenshot a
       * combination the product never produces.
       */
      const mode = preset.includes('light') || preset === 'paper' ? 'light' : 'dark'

      await page.emulateMedia({ colorScheme: mode, reducedMotion: 'reduce' })
      await page.goto(
        storyUrl('thumbnail-block--preview', {
          mode,
          theme: preset,
          args: `blockId:${REFERENCE_BLOCK}`,
        }),
      )

      await page
        .locator(`[data-thumbnail-ready="${REFERENCE_BLOCK}"] > div > *`)
        .first()
        .waitFor({ state: 'attached' })
      await readyForShot(page)

      await expect(page).toHaveScreenshot(`${preset}.png`)
    })
  }
})
