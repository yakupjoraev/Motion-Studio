import { expect, test } from '@playwright/test'

import { StudioPage } from '../fixtures/studio-page'

/** An image with an entrance on it: its Duration is a `number` control, and so a scrub field. */
const IMAGE = 'node_f009'

/** PERFORMANCE.md § Rendering, the core rule: a scrub reaches a ref and a CSS variable, not React. */
test.describe('an inspector scrub', () => {
  test.beforeEach(async ({ page }) => {
    const studio = new StudioPage(page)

    await studio.open('stress-200-nodes')
    await studio.layers.select(IMAGE)
  })

  test('does not re-render the canvas', async ({ page }) => {
    const studio = new StudioPage(page)
    const before = await studio.renderCount('canvas-root')

    await studio.scrubControl('Duration', { pixels: 200 })

    expect(await studio.renderCount('canvas-root')).toBe(before)
  })

  /** The guard on the count above: a drag that moved nothing would also cost zero renders. */
  test('commits the value it dragged to, in one history entry', async ({ page }) => {
    const studio = new StudioPage(page)
    const field = page.getByRole('spinbutton', { name: 'Duration' })
    const before = await field.inputValue()

    await studio.scrubControl('Duration', { pixels: 200 })

    expect(Number.parseFloat(await field.inputValue())).toBeGreaterThan(Number.parseFloat(before))

    await studio.undo()

    await expect(field).toHaveValue(before)
  })
})
