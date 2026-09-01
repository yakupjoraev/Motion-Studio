import { expect, test } from '@playwright/test'

import { StudioPage } from '../fixtures/studio-page'

/** A heading in the first section, dropped onto a text node in the second — a legal reparent. */
const DRAGGED = 'node_f004'
const ONTO = 'node_f015'

/**
 * DRAG_AND_DROP.md § The ghost: the document does not move until the drop commits, so the canvas
 * has nothing to re-render while the pointer travels. The count is taken with the button down.
 * ADR-316 is what this spec found.
 */
test.describe('dragging a node', () => {
  test('does not re-render the canvas while the pointer moves', async ({ page }) => {
    const studio = new StudioPage(page)

    await studio.open('stress-200-nodes')

    const before = await studio.renderCount('canvas-root')
    let held = -1

    await studio.dragLayer(DRAGGED, ONTO, async () => {
      // The ghost is the proof that a drag is in flight rather than a pointer that merely moved.
      await expect(page.getByTestId('node-ghost')).toBeVisible()
      held = await studio.renderCount('canvas-root')
    })

    expect(held - before).toBe(0)
  })
})
