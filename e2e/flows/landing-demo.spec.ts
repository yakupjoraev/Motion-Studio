import { expect, test } from '@playwright/test'

import { settled } from '../fixtures/settle'

/**
 * The first screen's one gesture, performed the way a visitor performs it: with a mouse.
 *
 * The hero frame runs the shipped components and the card is the shipped `hero-aurora`, dragged with
 * `computeSnap` from `packages/canvas` — the same function the studio calls. The keyboard path has a
 * spec of its own in `a11y/landing.spec.ts`; this is the path everybody else takes, and it had none.
 */
test.describe('the landing demo', () => {
  /*
   * All three engines, deliberately. Writing this spec found two defects only a second engine
   * could have shown, and both are fixed rather than skipped past: Firefox drew every preview at
   * full size because it does not divide a length by a length (ADR-392), and WebKit ended the drag
   * two `pointermove`s in by starting a native one on the card's thumbnail (ADR-393). A Chrome-only
   * spec here would have gone on passing through both.
   */
  test('drops the card into the slot and the page takes the block', async ({ page }) => {
    await page.goto('/')

    const card = page.getByRole('button', { name: /Hero block/ })
    await card.waitFor()
    await settled(page)

    const from = await card.boundingBox()
    const frame = await page.getByTestId('hero-stage').boundingBox()

    expect(from, 'the card is on the stage').not.toBeNull()
    expect(frame, 'the stage is laid out').not.toBeNull()

    await page.mouse.move(
      (from?.x ?? 0) + (from?.width ?? 0) / 2,
      (from?.y ?? 0) + (from?.height ?? 0) / 2,
    )
    await page.mouse.down()

    // The slot sits directly under the navbar, so a third of the way down the frame is inside it.
    await page.mouse.move(
      (frame?.x ?? 0) + (frame?.width ?? 0) * 0.3,
      (frame?.y ?? 0) + (frame?.height ?? 0) * 0.33,
      {
        steps: 12,
      },
    )
    await page.mouse.up()

    // Dropped: the card is gone from the stage and the caption offers to put it back.
    await expect(card).toHaveCount(0)

    await expect(page.getByText('Block placed')).toBeVisible()

    const undo = page.getByRole('button', { name: 'Undo' })
    await expect(undo).toBeVisible()

    await undo.click()
    await expect(page.getByRole('button', { name: /Hero block/ })).toBeVisible()
  })
})
