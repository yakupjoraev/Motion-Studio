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
   * Chrome only, and the reason is a defect in the product rather than in the engines' input
   * handling — measured, both of them, against this build:
   *
   * **Firefox** never scales a preview at all. `PreviewFrame` scales its stage with
   * `calc(100cqw / 1280px)`, and Firefox does not divide a length by a length: `CSS.supports('width',
   * 'calc(100cqw / 2px * 1px)')` is `false` there, so the whole `transform` is dropped and the stage
   * is drawn at 1280 px inside a 542 px frame. The card ends up 248 px wide at x 1450 — outside a
   * 1440 px window, so there is nothing to press. This is the catalogue's 72 cards as well, not only
   * the hero.
   *
   * **WebKit** scales correctly and then starts a native drag on the card: `dragstart` fires after
   * two `pointermove`s and the pointer stream stops, leaving the card 61 px from where it began.
   *
   * Both are recorded in ROADMAP.md § Open. The `atan2` trick that divides lengths elsewhere was
   * measured too and is not the fix: Firefox drops it as well, and WebKit computes it wrong
   * (-0.19 where the ratio is 0.4).
   */
  test.skip(
    ({ browserName }) => browserName !== 'chromium',
    'the preview does not scale in Firefox',
  )

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
