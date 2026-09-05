import { expect, test } from '@playwright/test'

import { StudioPage } from '../fixtures/studio-page'

/**
 * Operation 2 of DRAG_AND_DROP.md § The four operations, in a browser — ADR-359.
 *
 * The rules belong to `packages/dnd` and its unit tests. What only a pointer reaches is everything
 * between the press and the resolver: the 4 px activation, dnd-kit's collision pass over a
 * CSS-transformed scene, and the fact that a canvas node is a drag source at all — which it was not
 * until this prompt, and which no unit test could have noticed.
 */
/**
 * Composed rather than loaded from a fixture: the committed fixtures are single-rooted, and what this
 * spec needs is **siblings at the top level** — the level a canvas drag operates on, since a node
 * below it is reached by entering its parent rather than by dragging through (ADR-359).
 */
const PAGE = ['navbar', 'hero-centered', 'feature-grid']

test.describe('dragging a node on the canvas', () => {
  test.beforeEach(async ({ page }) => {
    const studio = new StudioPage(page)

    await studio.openEmpty()

    for (const block of PAGE) {
      await studio.palette.insert(block)
    }

    await expect.poll(() => studio.layers.names()).toHaveLength(PAGE.length + 1)
  })

  test('reorders two siblings by dragging one over the other', async ({ page }) => {
    const studio = new StudioPage(page)

    const before = await studio.layers.names()

    await studio.canvas.dragNode(3, 1)

    // The layer names in order are the assertion: a drag that ran and dropped the node back where it
    // started leaves the document identical, and a node count would not notice.
    await expect.poll(() => studio.layers.names()).not.toEqual(before)
  })

  test('puts the document back with one undo', async ({ page }) => {
    const studio = new StudioPage(page)

    const before = await studio.layers.names()

    await studio.canvas.dragNode(3, 1)
    await expect.poll(() => studio.layers.names()).not.toEqual(before)

    await studio.undo()

    await expect.poll(() => studio.layers.names()).toEqual(before)
  })

  test('leaves the document alone when the press never becomes a drag', async ({ page }) => {
    const studio = new StudioPage(page)

    const before = await studio.layers.names()
    const box = await studio.canvas.nodes().nth(3).boundingBox()

    expect(box).not.toBeNull()

    // Three pixels: under the 4 px activation distance, so this is a selection and nothing else.
    await page.mouse.move((box?.x ?? 0) + 20, (box?.y ?? 0) + 10)
    await page.mouse.down()
    await page.mouse.move((box?.x ?? 0) + 23, (box?.y ?? 0) + 10, { steps: 3 })
    await page.mouse.up()

    await expect(studio.canvas.selectionChip()).toBeVisible()
    expect(await studio.layers.names()).toEqual(before)
  })

  /*
   * ADR-359 § What is not finished. The pick-up works — `Enter` on a focused node starts the drag and
   * the live region announces "Hero — centred over Container, position 7 of 7" — and `Esc` cancels it.
   * What does not work is the step: an arrow moves the drag point one 8 px grid cell, and a page
   * section is hundreds of pixels tall, so the position never changes and the drop lands where it
   * started. Measured in the browser: five presses, five identical announcements.
   *
   * The fix is a step of one *position* rather than one grid cell, which needs the sensor to know the
   * boxes of the zone's children. An attempt at that is described in the ADR and is not in the tree:
   * it made no difference in the browser, and untested code that changes nothing is worse than an
   * honest gap. `fixme` rather than deleted, so the next session starts from the diagnosis.
   */
  test.fixme('is operable from the keyboard', async ({ page }) => {
    const studio = new StudioPage(page)

    const before = await studio.layers.names()

    /*
     * Focused directly rather than tabbed to: every node on the canvas is now a tab stop, so counting
     * presses would be asserting the tab order rather than the drag. The node is the activator.
     */
    await studio.canvas.nodes().nth(3).focus()

    // `Enter` picks up — held `Space` pans the canvas, so it cannot also be the pick-up key (ADR-136).
    await page.keyboard.press('Enter')
    await page.keyboard.press('ArrowUp')
    await page.keyboard.press('ArrowUp')
    await page.keyboard.press('Enter')

    await expect.poll(() => studio.layers.names()).not.toEqual(before)
  })
})
