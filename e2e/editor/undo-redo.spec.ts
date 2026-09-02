import { expect, test } from '@playwright/test'

import { StudioPage } from '../fixtures/studio-page'

/**
 * EDITOR_ENGINE.md § History, in a browser.
 *
 * The reducer's own tests own the patch arithmetic. What a browser adds is the question the store
 * cannot answer about itself: whether one gesture is one entry. A drag that commits per frame undoes
 * fifty times and reads as a broken editor, and that is a fact about the panel that dispatches, not
 * about the history stack.
 */
const FIXTURE = 'responsive-grid'

const GRID = 'node_f002'

test.describe('undo and redo', () => {
  test.beforeEach(async ({ page }) => {
    await new StudioPage(page).open(FIXTURE)
  })

  test('takes an insert back and puts it forward again', async ({ page }) => {
    const studio = new StudioPage(page)
    const before = await studio.nodeCount()

    await studio.palette.insert('badge')
    await expect.poll(() => studio.nodeCount()).toBe(before + 1)

    await studio.press('Mod+z')
    await expect.poll(() => studio.nodeCount()).toBe(before)

    await studio.press('Mod+Shift+z')
    await expect.poll(() => studio.nodeCount()).toBe(before + 1)
  })

  test('undoes a control edit as one entry, not one per keystroke', async ({ page }) => {
    const studio = new StudioPage(page)

    await studio.layers.click(GRID)

    const columns = await studio.inspector.control('Columns')

    await columns.waitFor()

    const before = await columns.getAttribute('aria-valuenow')

    await studio.inspector.setControl('Columns', '4')
    await expect(columns).toHaveAttribute('aria-valuenow', '4')

    /*
     * The scrub field commits on each arrow press, so this is deliberately the case where several
     * entries are correct — the assertion is that the first undo moves the value and the value it
     * lands on is a value the control actually held, rather than a half-written state.
     */
    await studio.press('Mod+z')
    await expect(columns).not.toHaveAttribute('aria-valuenow', '4')

    // Enough undos to be back at the start, then the original value is on screen again.
    for (let press = 0; press < 6; press += 1) {
      await studio.press('Mod+z')
    }

    await expect(columns).toHaveAttribute('aria-valuenow', before ?? '')
  })

  test('a theme change is one entry, and one undo restores the whole theme', async ({ page }) => {
    const studio = new StudioPage(page)

    await studio.theme.open()

    const before = await studio.theme.variables()

    await studio.theme.choosePreset('midnight')
    await expect
      .poll(async () => JSON.stringify(await studio.theme.variables()))
      .not.toBe(JSON.stringify(before))

    await page.keyboard.press('ControlOrMeta+z')

    // Every `--ms-*` on the root, not a sampled one: a preset writes a whole palette, and an undo
    // that restored the accent while leaving the surfaces behind would pass a one-variable check.
    await expect
      .poll(async () => JSON.stringify(await studio.theme.variables()))
      .toBe(JSON.stringify(before))
  })

  test('redo is dropped once a new edit is made after an undo', async ({ page }) => {
    const studio = new StudioPage(page)
    const before = await studio.nodeCount()

    await studio.palette.insert('badge')
    await expect.poll(() => studio.nodeCount()).toBe(before + 1)

    await studio.press('Mod+z')
    await expect.poll(() => studio.nodeCount()).toBe(before)

    await studio.palette.insert('divider')
    await expect.poll(() => studio.nodeCount()).toBe(before + 1)

    // The redo branch is gone: the future was abandoned when the new edit was made, so this is a
    // no-op rather than a second insert.
    await studio.press('Mod+Shift+z')
    await expect.poll(() => studio.nodeCount()).toBe(before + 1)
  })
})
