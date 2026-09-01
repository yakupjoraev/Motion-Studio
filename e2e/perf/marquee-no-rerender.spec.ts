import { expect, test } from '@playwright/test'

import { StudioPage } from '../fixtures/studio-page'

/**
 * The rectangle is written to the overlay element's style, so the sweep costs the canvas nothing.
 * PERFORMANCE.md budgets one render for the commit; the selection outlines are drawn in the overlay
 * layer too, so the whole gesture measures zero and zero is what this asserts.
 */
test.describe('a marquee selection', () => {
  test('changes the selection without re-rendering the canvas at all', async ({ page }) => {
    const studio = new StudioPage(page)

    await studio.open('stress-200-nodes')

    const before = await studio.renderCount('canvas-root')
    let held = -1

    await studio.marquee({ dx: -700, dy: 700 }, async () => {
      await expect(page.locator('[data-testid="canvas-root"][data-marquee="true"]')).toBeVisible()
      held = await studio.renderCount('canvas-root')
    })

    await expect(page.getByTestId('status-selection')).not.toHaveText('No selection')

    expect(held - before).toBe(0)
    expect((await studio.renderCount('canvas-root')) - before).toBe(0)
  })
})
