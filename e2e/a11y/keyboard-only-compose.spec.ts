import { type Page, expect, test } from '@playwright/test'

import { StudioPage } from '../fixtures/studio-page'

/**
 * ACCESSIBILITY.md § Testing, the manual checklist's flow B, as a spec: compose a page without a
 * mouse. Nothing here clicks or focuses an element directly — every step is a key press, so the path
 * it walks is the path a keyboard user has.
 *
 * The route is F2 twice to the left panel, three tabs to the palette's search box, and nine more past
 * the category filters to the grid, where the arrows walk the cards and `Enter` inserts one.
 */
const focusedCard = (page: Page): Promise<string | null> =>
  page.evaluate(() => document.activeElement?.getAttribute('data-block-card') ?? null)

/** `textContent`, not `innerText`: Firefox reads nothing out of a clipped `sr-only` element. */
const announced = async (page: Page): Promise<string> =>
  (await page.getByTestId('command-announcer').textContent()) ?? ''

/**
 * Tab until a card has focus rather than a fixed number of presses: the category filters between the
 * search box and the grid are a count that differs by engine, and a fixed one measured Chrome.
 */
const tabToFirstCard = async (page: Page, limit = 24): Promise<boolean> => {
  for (let press = 0; press < limit; press += 1) {
    await page.keyboard.press('Tab')

    if ((await focusedCard(page)) !== null) {
      return true
    }
  }

  return false
}

test.describe('composing a page with the keyboard alone', () => {
  test('inserts four sections and says what each one did', async ({ page }) => {
    const studio = new StudioPage(page)

    await studio.open('responsive-grid')

    const before = await studio.nodeCount()

    // F2 walks the three regions — UI_GUIDELINES.md § Focus and keyboard.
    await page.keyboard.press('F2')
    await page.keyboard.press('F2')

    await expect(page.getByRole('complementary', { name: 'Left panel' })).toBeFocused()

    for (let press = 0; press < 3; press += 1) {
      await page.keyboard.press('Tab')
    }

    await expect(page.getByRole('searchbox', { name: 'Search blocks' })).toBeFocused()

    await page.keyboard.type('section')

    // ACCESSIBILITY.md § Block palette: the result count is announced, not only shown.
    await expect
      .poll(async () => (await page.getByTestId('block-count').textContent()) ?? '')
      .toMatch(/\d+ blocks? match/)

    expect(await tabToFirstCard(page), 'a block card is reachable by Tab').toBe(true)

    const inserted: string[] = []

    for (const key of [
      'Enter',
      'ArrowRight',
      'Enter',
      'ArrowDown',
      'Enter',
      'ArrowRight',
      'Enter',
    ]) {
      await page.keyboard.press(key)
      await page.waitForTimeout(200)

      if (key === 'Enter') {
        inserted.push(await announced(page))
      }
    }

    expect(inserted).toHaveLength(4)

    for (const sentence of inserted) {
      expect(sentence, inserted.join(' / ')).toMatch(/^Add .+\. \d+ blocks\.$/)
    }

    // Four presses, four blocks: the count is the proof the inserts landed rather than announced.
    await expect.poll(() => studio.nodeCount()).toBe(before + 4)
  })

  test('reaches the inspector from the canvas and edits a value', async ({ page }) => {
    const studio = new StudioPage(page)

    await studio.open('responsive-grid')

    // F2 lands on the canvas *region*; one Tab moves into the surface itself, whose own `Tab` then
    // walks the blocks at this level rather than leaving it.
    await page.keyboard.press('F2')

    await expect(page.getByRole('main', { name: 'Canvas' })).toBeFocused()

    await page.keyboard.press('Tab')

    const canvas = page.getByRole('application', { name: 'Design canvas' })

    await expect(canvas).toBeFocused()
    // `role="application"` takes every key, so the surface has to say which ones — ADR-328.
    const help = await canvas.evaluate((element) => {
      const id = element.getAttribute('aria-describedby')

      return id === null ? '' : (document.getElementById(id)?.textContent ?? '')
    })

    expect(help).toMatch(/Tab and Shift Tab/)
    expect(help).toMatch(/F2/)

    await page.keyboard.press('Tab')

    await expect(page.getByTestId('status-selection')).not.toHaveText('No selection')
    await expect
      .poll(async () => (await page.getByTestId('canvas-announcer').textContent()) ?? '')
      .toMatch(/selected\./)

    // Canvas → left → inspector, which is the cycle UI_GUIDELINES.md § Focus and keyboard states.
    await page.keyboard.press('F2')
    await page.keyboard.press('F2')

    await expect(page.getByRole('complementary', { name: 'Inspector' })).toBeFocused()

    let reached = false

    for (let press = 0; press < 30 && !reached; press += 1) {
      await page.keyboard.press('Tab')
      reached = await page.evaluate(
        () => document.activeElement?.getAttribute('role') === 'spinbutton',
      )
    }

    expect(reached, 'a scrub field is reachable from the inspector by Tab').toBe(true)

    const read = (): Promise<string> =>
      page.evaluate(() => document.activeElement?.getAttribute('aria-valuetext') ?? '')

    const before = await read()

    await page.keyboard.press('ArrowUp')

    // The unit is in the announcement, not just the number — ACCESSIBILITY.md § Inspector.
    await expect.poll(read).not.toBe(before)
    expect(await read()).toMatch(/\d/)
  })
})
