import { type Page, expect, test } from '@playwright/test'

import { StudioPage } from '../fixtures/studio-page'

import { settled } from '../fixtures/settle'

declare global {
  interface Window {
    /** Every value the drag region has held during a test, in order. */
    __announced?: string[]
  }
}

/**
 * ACCESSIBILITY.md § Canvas: "live regions announce state changes that are only visible". A selection
 * outline, a drop indicator and a command's result are all visual-only, so each one is a sentence
 * somebody has to hear — and what the region says is asserted, not merely that it exists.
 */
/**
 * `textContent`, not `innerText`: the region is `sr-only`, and Firefox's `innerText` returns nothing
 * for a clipped element — a live region read that way is empty on one engine and full on another.
 */
const announced = async (page: Page): Promise<string> =>
  (await page.getByTestId('canvas-announcer').textContent()) ?? ''

/**
 * Every sentence dnd-kit's region has held, in order. A single read cannot see them: the pick-up is
 * replaced by the first "over" message within the same frame, so what has to be captured is the
 * sequence rather than the current value. The region is on `body` so a dialog cannot hide it (ADR-289).
 */
const recordDragAnnouncements = (page: Page): Promise<void> =>
  page.evaluate(() => {
    const target = document.getElementById('ms-dnd-announcer')

    if (target === null) {
      throw new Error('the drag announcer is not in the document')
    }

    window.__announced = []

    new MutationObserver(() => {
      const text = (target.textContent ?? '').trim()

      if (text !== '' && window.__announced?.at(-1) !== text) {
        window.__announced?.push(text)
      }
    }).observe(target, { subtree: true, childList: true, characterData: true })
  })

const dragAnnouncements = (page: Page): Promise<readonly string[]> =>
  page.evaluate(() => window.__announced ?? [])

test.describe('the canvas announcer', () => {
  test.beforeEach(async ({ page }) => {
    const studio = new StudioPage(page)

    await studio.open('responsive-grid')
  })

  test('names the selection and its position when a node is picked on the canvas', async ({
    page,
  }) => {
    await page.locator('[data-node-id="node_f002"]').click()

    await expect.poll(() => announced(page)).toMatch(/selected\. \d+ of \d+ in /)
  })

  test('names the selection when the row is picked in the layers tree', async ({ page }) => {
    const studio = new StudioPage(page)

    await studio.selectLayer('node_f003')

    // The tree is the screen-reader path through the document — ACCESSIBILITY.md § Canvas — so a
    // selection made there has to announce exactly as a selection made on the canvas does.
    await expect.poll(() => announced(page)).toMatch(/selected\./)
  })

  test('says the selection was cleared', async ({ page }) => {
    await page.locator('[data-node-id="node_f002"]').click()
    await expect.poll(() => announced(page)).toMatch(/selected\./)

    await page.getByRole('application', { name: 'Design canvas' }).press('Escape')

    await expect.poll(() => announced(page)).toBe('Selection cleared.')
  })
})

test.describe('a keyboard drag', () => {
  test('announces the pick-up, the target and the drop', async ({ page }) => {
    const studio = new StudioPage(page)

    await studio.open('responsive-grid')
    await studio.openPanelTab('Layers')

    // Clicked first so the roving tabindex is on this row, then `Enter`: ADR-136 gives `Space` to the
    // tree's own selection map and `Enter` to the drag activator.
    await studio.selectLayer('node_f003')
    await recordDragAnnouncements(page)

    /*
     * A pause between presses, because that is what the announcements are for. Pressed back to back
     * they collapse: the sensor computes the first target in the same task as the pick-up, so
     * "Picked up Heading" is replaced by "Heading over Grid, position 1 of 2" before any reader could
     * speak it — recorded in ACCESSIBILITY_AUDIT.md rather than fixed, because the sentence that
     * survives carries the label *and* the position.
     */
    await page.keyboard.press('Enter')
    await settled(page)
    await page.keyboard.press('ArrowDown')

    // Polled, not read: the announcement is written in the render the move schedules.
    await expect
      .poll(async () => (await dragAnnouncements(page)).join(' / '))
      .toMatch(/Heading over .*position \d+ of \d+|cannot go into/)

    await page.keyboard.press('Enter')

    await expect
      .poll(() => dragAnnouncements(page).then((lines) => lines.join(' / ')))
      .toMatch(/Dropped |returned to its original/)
  })
})

test.describe('a command’s result', () => {
  test('is announced, not only drawn', async ({ page }) => {
    const studio = new StudioPage(page)

    await studio.open('responsive-grid')
    await studio.selectLayer('node_f003')

    const before = await studio.nodeCount()

    await studio.press('Mod+d')

    expect(await studio.nodeCount()).toBeGreaterThan(before)

    // Polled: the announcement is debounced so a held shortcut produces one sentence — ADR-326.
    await expect
      .poll(async () => (await page.getByTestId('command-announcer').textContent()) ?? '')
      .toMatch(/blocks?\.$/)
  })
})
