import { expect, test } from '@playwright/test'

import { StudioPage } from '../fixtures/studio-page'

import { settled } from '../fixtures/settle'

/**
 * DRAG_AND_DROP.md § Accessibility: "the full drag can be performed with the keyboard on all four
 * operations." All four are declared here, including the ones that cannot be — an operation missing
 * from the file is an operation nobody counted.
 *
 * `Space` picks a palette card up and `Enter` inserts it; in the tree it is the mirror image, because
 * a row is already in the document and `Space` selects it — ADR-136.
 *
 * Operations 1, 2 and 4 work end to end; 2 and 4 are asserted in `editor/dnd-canvas.spec.ts`, where
 * the canvas geometry they depend on lives. Operation 3's *drag* still does not choose a position
 * (ADR-327, re-measured under ADR-381), so what is asserted for the tree is the reorder shortcut,
 * which is the path a keyboard user is given, and that one case is `fixme` with its diagnosis.
 */
test.describe('operation 1 — a palette card into the canvas', () => {
  test('inserts on Enter, which is the primary keyboard path', async ({ page }) => {
    const studio = new StudioPage(page)

    await studio.open('responsive-grid')
    await studio.layers.select('node_f002')
    await studio.openPanelTab('Blocks')

    const before = await studio.nodeCount()
    const card = page.locator('[data-block-card="heading"]')

    await card.scrollIntoViewIfNeeded()
    await card.focus()

    await expect(card).toHaveAttribute('aria-roledescription', /draggable/)

    await page.keyboard.press('Enter')

    await expect.poll(() => studio.nodeCount()).toBe(before + 1)
  })

  test('announces the pick-up and cancels on Escape', async ({ page }) => {
    const studio = new StudioPage(page)

    await studio.open('responsive-grid')
    await studio.openPanelTab('Blocks')

    const before = await studio.nodeCount()
    const card = page.locator('[data-block-card="heading"]')

    await card.scrollIntoViewIfNeeded()
    await card.focus()
    await page.keyboard.press('Space')

    await expect
      .poll(async () => (await page.locator('#ms-dnd-announcer').textContent()) ?? '')
      .toMatch(/Picked up |over |not over a valid target/)

    await page.keyboard.press('Escape')
    await settled(page)

    expect(await studio.nodeCount()).toBe(before)
  })

  test('picks up, moves and drops with the keyboard alone', async ({ page }) => {
    const studio = new StudioPage(page)

    await studio.open('responsive-grid')
    await studio.openPanelTab('Blocks')

    const before = await studio.nodeCount()
    const search = page.getByRole('searchbox', { name: 'Search blocks' })

    await search.focus()
    await page.keyboard.type('section')

    // Tab until a card has focus: the number of filters between the two differs by engine.
    let onCard = false

    for (let press = 0; press < 24 && !onCard; press += 1) {
      await page.keyboard.press('Tab')
      onCard = await page.evaluate(
        () => document.activeElement?.hasAttribute('data-block-card') ?? false,
      )
    }

    expect(onCard, 'a block card is reachable by Tab').toBe(true)

    await page.keyboard.press('Space')
    await settled(page)
    await page.keyboard.press('ArrowDown')

    // Polled, not read: the announcement is written in the render the move schedules.
    await expect
      .poll(async () => (await page.locator('#ms-dnd-announcer').textContent()) ?? '')
      .toMatch(/over .*position \d+ of \d+/)

    await page.keyboard.press('Space')

    await expect
      .poll(async () => (await page.locator('#ms-dnd-announcer').textContent()) ?? '')
      .toMatch(/Dropped .* at position \d+\./)
    await expect.poll(() => studio.nodeCount()).toBe(before + 1)
  })
})

test.describe('operation 3 — a layers row to another position', () => {
  test('reorders with Mod+ArrowDown and says what happened', async ({ page }) => {
    const studio = new StudioPage(page)

    await studio.open('responsive-grid')
    await studio.layers.select('node_f003')

    const order = (): Promise<string> =>
      page.evaluate(() =>
        [...document.querySelectorAll('[data-layer-row]')]
          .map((row) => row.getAttribute('data-layer-row'))
          .join(','),
      )

    const before = await order()

    await studio.press('Mod+ArrowDown')

    await expect.poll(order).not.toBe(before)
    // The result is heard, not only seen — ACCESSIBILITY.md § Canvas, ADR-326.
    await expect
      .poll(async () => (await page.getByTestId('command-announcer').textContent()) ?? '')
      .toMatch(/\. \d+ blocks?\.$/)
  })

  test('picks a row up and drops it with the keyboard, announcing both', async ({ page }) => {
    const studio = new StudioPage(page)

    await studio.open('responsive-grid')
    await studio.layers.select('node_f003')

    await page.keyboard.press('Enter')
    await settled(page)

    await expect
      .poll(async () => (await page.locator('#ms-dnd-announcer').textContent()) ?? '')
      .toMatch(/over .*position \d+ of \d+/)

    await page.keyboard.press('Enter')

    await expect
      .poll(async () => (await page.locator('#ms-dnd-announcer').textContent()) ?? '')
      .toMatch(/Dropped .* at position \d+\./)
  })

  /*
   * ADR-327, still open, and re-measured after ADR-381 rather than re-assumed. The step is no longer
   * the problem: the zone under a tree drag is the row's *parent* (`Grid`, children `f003, f004`),
   * the surface supplies both boxes, the dragged row is excluded, and the getter computes a
   * destination past the remaining sibling's midpoint. What does not happen is the move: the
   * announcement stays at "position 1 of 2" and the getter is called once. The canvas path with the
   * same code steps and announces (`editor/dnd-canvas.spec.ts`), so what differs is the tree's own
   * geometry — `layerRects` reports the strip of ADR-133, in the panel's coordinates, while
   * `collisionRect` is the viewport's. That comparison is the next measurement, not a guess to fix.
   */
  test.fixme('chooses a different position inside the drag', async ({ page }) => {
    const studio = new StudioPage(page)

    await studio.open('responsive-grid')
    await studio.layers.select('node_f003')

    const announcer = page.locator('#ms-dnd-announcer')
    const position = async (): Promise<string> => {
      const said = (await announcer.textContent()) ?? ''

      return /position (\d+) of \d+/.exec(said)?.[1] ?? ''
    }

    await page.keyboard.press('Enter')
    await settled(page)
    await expect.poll(position).not.toBe('')

    const before = await position()

    await page.keyboard.press('ArrowDown')

    // One press, one position — the number in the announcement is the assertion, not a pixel count.
    await expect.poll(position).not.toBe(before)
  })
})

/*
 * Operations 2 and 4 are wired (ADR-359 for the source, ADR-381 for the keyboard step) and asserted
 * in `editor/dnd-canvas.spec.ts`: a keyboard drag that reorders the canvas and announces a new
 * position on every press, and a pointer drag across both surfaces in either direction. They live
 * there rather than here because they need a composed page with siblings at the top level — the
 * level a canvas drag operates on — which is the fixture that file builds.
 */
