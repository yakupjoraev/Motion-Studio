import { expect, test } from '@playwright/test'

import { ExportPage } from '../fixtures/export-page'
import { StudioPage } from '../fixtures/studio-page'

/**
 * Flow C — PRODUCT.md § User flows: select a block, give it a motion preset, tune the preset's own
 * parameters, and take the code away.
 *
 * The claim under test is the one ANIMATION_SYSTEM.md makes and a unit test cannot: a preset is not a
 * class name the exporter copies out, it is a spec the printer reads — so a spring the user dragged
 * has to arrive in the exported component as the numbers they dragged it to.
 */
const FIXTURE = 'export-landing'

/** Hover, because `magnetic` is a hover preset — the channel is part of what a preset is. */
const PRESET = 'Magnetic'

/**
 * A preset only offers itself to a block that declares its channel — `capabilities.supportsMotion`,
 * and the card is disabled with the reason on it otherwise. `badge` is one of the seven that take
 * hover, and it is in this fixture; a hero is not, which is a rule worth a spec knowing about.
 */
const TARGET = 'badge'

/** The channel `Magnetic` lives on, and the section its parameters are drawn in. */
const CHANNEL = 'Hover'

/** The spring editor labels its own handles — `Spring stiffness`, not `Stiffness`. */
const STIFFNESS = 'Spring stiffness'

test.describe('tuning motion', () => {
  test.slow()

  test('applies a preset, tunes its spring, and exports what was tuned', async ({ page }) => {
    const studio = new StudioPage(page)

    await studio.open(FIXTURE)
    await studio.selectNode(TARGET)

    await studio.motion.open()
    await studio.motion.applyPreset(PRESET)

    // The parameters appear because a preset was applied — an empty `spec.params` still resolves to
    // the preset's own defaults, which is the bug ADR-151's draft was written against.
    await expect(studio.motion.params(CHANNEL)).toBeVisible()

    const before = await studio.motion.paramValue(CHANNEL, STIFFNESS)

    await studio.motion.dragParam(CHANNEL, STIFFNESS, 80)

    const after = await studio.motion.paramValue(CHANNEL, STIFFNESS)

    // Quantised on commit to the nearest named spring, so the assertion is that the drag moved it —
    // asserting a number here would be re-deriving the quantiser's arithmetic in the spec.
    expect(after).not.toBe(before)

    const exportPage = new ExportPage(page)

    await exportPage.open()
    await exportPage.settled()

    /*
     * Which file the spring lands in is the printer's decision, not the spec's: a small block is
     * inlined into the component that holds it rather than given a file of its own, so `badge` has no
     * `badge.tsx` to open. The files are walked instead, and the first one carrying a spring is the
     * answer — asserting a filename here would be asserting the printer's inlining rule twice.
     */
    const files = await exportPage.paths()
    let printed: string | undefined

    for (const path of files) {
      await exportPage.selectFile(path)

      const source = await exportPage.shownFile()

      if (source.includes('stiffness')) {
        printed = source
        break
      }
    }

    expect(printed, 'a file carries the tuned spring').toBeDefined()
    // The stiffness in the code is the one the panel is showing, not the preset's default.
    expect(printed).toContain(String(after))
  })

  /**
   * The same tuning without a pointer. A preset card is a button and a slider takes arrows, so the
   * keyboard path exists — this is the spec that keeps it existing.
   */
  test('applies and tunes a preset from the keyboard', async ({ page }) => {
    const studio = new StudioPage(page)

    await studio.open(FIXTURE)
    await studio.selectNode(TARGET)
    await studio.motion.open()

    const card = studio.motion.card(PRESET)

    await card.scrollIntoViewIfNeeded()
    await card.focus()
    await expect(card).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(card).toHaveAttribute('aria-pressed', 'true')

    const slider = studio.motion.params(CHANNEL).getByRole('slider', { name: STIFFNESS })

    await slider.scrollIntoViewIfNeeded()
    await slider.focus()

    const before = await studio.motion.paramValue(CHANNEL, STIFFNESS)

    for (let press = 0; press < 6; press += 1) {
      await page.keyboard.press('ArrowRight')
    }

    await expect.poll(() => studio.motion.paramValue(CHANNEL, STIFFNESS)).not.toBe(before)
  })
})
