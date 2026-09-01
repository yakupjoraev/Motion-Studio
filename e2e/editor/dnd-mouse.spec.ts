import { expect, test } from '@playwright/test'

import { StudioPage } from '../fixtures/studio-page'

/**
 * DRAG_AND_DROP.md § Pointer, in a browser.
 *
 * `packages/dnd` owns the resolver and its tests own the rules. Everything between a pointer going
 * down and that resolver being called is dnd-kit, an activation distance and a collision pass — none
 * of which a unit test touches, and all of which a pointer does.
 */
const FIXTURE = 'responsive-grid'

const HEADING = 'node_f003'
const TEXT = 'node_f004'

test.describe('dragging with the pointer', () => {
  test.beforeEach(async ({ page }) => {
    await new StudioPage(page).open(FIXTURE)
  })

  test('drops a palette card onto the canvas as a node', async ({ page }) => {
    const studio = new StudioPage(page)
    const before = await studio.nodeCount()

    const canvas = await page.getByTestId('canvas-artboard').boundingBox()

    expect(canvas).not.toBeNull()

    await studio.palette.dragToCanvas('badge', {
      x: (canvas?.x ?? 0) + (canvas?.width ?? 0) / 2,
      y: (canvas?.y ?? 0) + 80,
    })

    await expect.poll(() => studio.nodeCount()).toBe(before + 1)
  })

  test('reorders two siblings in the layers tree', async ({ page }) => {
    const studio = new StudioPage(page)

    const before = await studio.layerNames()

    await studio.dragLayer(TEXT, HEADING)

    // The names in tree order are the assertion: a drag that "worked" but dropped the row back where
    // it started leaves the document identical, and a count would not notice.
    await expect.poll(() => studio.layerNames()).not.toEqual(before)
  })

  test('leaves the document alone when a drag is released where it began', async ({ page }) => {
    const studio = new StudioPage(page)

    const before = await studio.layerNames()

    await studio.dragLayer(TEXT, TEXT)

    await expect.poll(() => studio.layerNames()).toEqual(before)
  })
})
