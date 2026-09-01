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
 * Operation 1 works end to end. Operation 3's *drag* does not — a row begins inside its own zone and
 * the position never moves from there (ADR-327) — so what is asserted for the tree is the reorder
 * shortcut, which is the path a keyboard user is given, and the drag is `fixme`.
 */
test.describe('operation 1 — a palette card into the canvas', () => {
  test('inserts on Enter, which is the primary keyboard path', async ({ page }) => {
    const studio = new StudioPage(page)

    await studio.open('responsive-grid')
    await studio.selectLayer('node_f002')
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
    await studio.selectLayer('node_f003')

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
    await studio.selectLayer('node_f003')

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

  test.fixme('chooses a different position inside the drag — ADR-327', async () => {
    // Measured: eight ArrowDowns leave the target at "position 1 of 2", and the drop commits that.
  })
})

/*
 * DRAG_AND_DROP.md § The four operations: "Operations 1 and 3 are wired; 2 and 4 need a canvas node to
 * be a drag *source*, which is the work that follows." `useDraggableNode` is attached to layer rows
 * only, so there is no gesture on the canvas for a keyboard or a pointer to perform — an unbuilt
 * feature rather than an accessibility defect, recorded in ACCESSIBILITY_AUDIT.md as one.
 */
test.describe('operations 2 and 4 — a canvas node as a drag source', () => {
  test.skip('moves a node within the canvas by keyboard', () => {
    // Unwired: the canvas registers no draggable node.
  })

  test.skip('moves a node between the canvas and the tree by keyboard', () => {
    // Unwired: the canvas registers no draggable node.
  })
})
