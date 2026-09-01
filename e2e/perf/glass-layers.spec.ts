import { expect, test } from '@playwright/test'

import { countLayers, recordScroll } from '../fixtures/measure'
import { StudioPage } from '../fixtures/studio-page'

/** PERFORMANCE.md § Layer count: "Chrome's layer count is checked … when it exceeds 40". */
const LAYER_BUDGET = 40

/**
 * Thirty-three nodes of `backdrop-filter` and aurora — the document where layers, not frames, are
 * the scarce resource. Settled is what it costs sitting there; the peak is the animating effects.
 */
test.describe('the glass fixture', () => {
  test('composites fewer than forty layers, settled and at its peak', async ({ page }, info) => {
    const studio = new StudioPage(page)

    await studio.open('stress-glass')

    const layers = await countLayers(page, async () => {
      await recordScroll(page, { duration: 3000 })
    })
    const line = `glass: ${layers.settled} layers settled, ${layers.peak} at peak`

    info.annotations.push({ type: 'measurement', description: line })
    console.log(`  ${line}`)

    expect(layers.settled).toBeLessThan(LAYER_BUDGET)
    expect(layers.peak).toBeLessThan(LAYER_BUDGET)
  })

  /** DESIGN_SYSTEM.md § Glass, rule 2: the status bar warns over four surfaces. Here it stays quiet. */
  test('stays inside the backdrop cap', async ({ page }) => {
    const studio = new StudioPage(page)

    await studio.open('stress-glass')

    await expect(page.getByTestId('status-backdrop')).toHaveCount(0)
  })
})
