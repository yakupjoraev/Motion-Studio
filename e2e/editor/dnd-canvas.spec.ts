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

/**
 * The ids of a composed document are generated, so a cross-surface spec reads the canvas for the id
 * and asks the tree for that row — the two surfaces are only comparable through the node they share.
 */
async function nodeIdAt(studio: StudioPage, index: number): Promise<string> {
  const id = await studio.canvas.nodes().nth(index).getAttribute('data-node-id')

  if (id === null) {
    throw new Error(`canvas node ${index} carries no id`)
  }

  return id
}

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
   * ADR-381: one press, one position. A grid cell is 8 px and a page section is hundreds of pixels
   * tall, so the step that mattered was never the one ADR-127 gives a nudge.
   */
  test('is operable from the keyboard', async ({ page }) => {
    const studio = new StudioPage(page)

    const before = await studio.layers.names()

    /*
     * Focused directly rather than tabbed to: every node on the canvas is now a tab stop, so counting
     * presses would be asserting the tab order rather than the drag. The node is the activator.
     */
    await studio.canvas.nodes().nth(3).focus()

    // `Enter` picks up — held `Space` pans the canvas, so it cannot also be the pick-up key (ADR-136).
    await page.keyboard.press('Enter')

    /*
     * Wait for the pick-up to be announced before stepping, which is what a person does too: the
     * announcement is the drag reporting that it knows where it is. Pressing straight through passed
     * against a dev server and failed against a production build, because there the arrow arrived
     * before the first collision pass had run and the step had no zone to count positions in.
     */
    await expect(page.locator('#ms-dnd-announcer')).toContainText(/position \d+ of \d+/)

    await page.keyboard.press('ArrowUp')
    await page.keyboard.press('Enter')

    await expect.poll(() => studio.layers.names()).not.toEqual(before)
  })

  /*
   * Operation 4 of DRAG_AND_DROP.md § The four operations, which had no spec at all: the same source
   * carries across the two surfaces, and `DropZone.surface` (ADR-181) is what keeps the two zones a
   * node registers apart. Asserted by the document changing, because that is the only thing a
   * cross-surface drop is for.
   */
  test('carries a node from the canvas into the layers tree', async ({ page }) => {
    const studio = new StudioPage(page)

    const before = await studio.layers.names()
    const from = await studio.canvas.nodes().nth(3).boundingBox()
    const onto = await studio.layers.row(await nodeIdAt(studio, 1)).boundingBox()

    expect(from).not.toBeNull()
    expect(onto).not.toBeNull()

    // Split the way every other drag in this suite is: the short first move crosses the 4 px
    // activation distance, and one long move would outrun dnd-kit's collision pass.
    await page.mouse.move((from?.x ?? 0) + 20, (from?.y ?? 0) + 10)
    await page.mouse.down()
    await page.mouse.move((from?.x ?? 0) + 20, (from?.y ?? 0) + 22, { steps: 5 })
    await page.mouse.move(
      (onto?.x ?? 0) + (onto?.width ?? 0) / 2,
      (onto?.y ?? 0) + (onto?.height ?? 0) / 2,
      { steps: 25 },
    )
    await page.mouse.up()

    await expect.poll(() => studio.layers.names()).not.toEqual(before)
  })

  test('carries a row from the layers tree onto the canvas', async ({ page }) => {
    const studio = new StudioPage(page)

    const before = await studio.layers.names()
    const from = await studio.layers.row(await nodeIdAt(studio, 3)).boundingBox()
    const onto = await studio.canvas.nodes().nth(1).boundingBox()

    expect(from).not.toBeNull()
    expect(onto).not.toBeNull()

    await page.mouse.move((from?.x ?? 0) + 40, (from?.y ?? 0) + 8)
    await page.mouse.down()
    await page.mouse.move((from?.x ?? 0) + 40, (from?.y ?? 0) + 20, { steps: 5 })
    await page.mouse.move(
      (onto?.x ?? 0) + (onto?.width ?? 0) / 2,
      (onto?.y ?? 0) + (onto?.height ?? 0) / 2,
      { steps: 25 },
    )
    await page.mouse.up()

    await expect.poll(() => studio.layers.names()).not.toEqual(before)
  })

  test('says which position the drag is on, on every press', async ({ page }) => {
    const studio = new StudioPage(page)
    const announcer = page.locator('#ms-dnd-announcer')

    /*
     * The assertion is that the announced position *moves*, not that it is a particular number.
     * dnd-kit announces on `over` and a reorder inside one container never changes it (ADR-381), so
     * what this guards is that a move is announced at all. Pinning "3 of 3" then "2 of 3" also
     * asserted how many siblings had been measured by the time of the press, which is a property of
     * the machine: it held here and timed out on a runner carrying nine shards.
     */
    const position = async (): Promise<string> => {
      const said = (await announcer.textContent()) ?? ''

      return /position (\d+) of \d+/.exec(said)?.[1] ?? ''
    }

    await studio.canvas.nodes().nth(3).focus()
    await page.keyboard.press('Enter')

    await expect.poll(position).not.toBe('')

    const first = await position()

    await page.keyboard.press('ArrowUp')

    await expect.poll(position).not.toBe(first)

    const second = await position()

    await page.keyboard.press('ArrowUp')

    await expect.poll(position).not.toBe(second)
    expect(Number(second)).toBeLessThan(Number(first))

    await page.keyboard.press('Escape')
  })
})
