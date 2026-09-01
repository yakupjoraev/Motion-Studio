import { expect, test } from '@playwright/test'

import { StudioPage } from '../fixtures/studio-page'

/**
 * EDITOR_ENGINE.md § Clipboard and SHORTCUTS.md § Editing, in a browser.
 *
 * The clipboard slice prefers the **system** clipboard when it holds a payload of ours and falls back
 * to its own copy otherwise, which is a branch only a browser has: a unit test has no system
 * clipboard to disagree with. Reading it back needs a permission Chromium alone grants under
 * automation, so what is asserted here is the document and what the app announced about it.
 */
const FIXTURE = 'responsive-grid'

const HEADING = 'node_f003'

test.describe('the clipboard', () => {
  test.beforeEach(async ({ page }) => {
    await new StudioPage(page).open(FIXTURE)
  })

  test('duplicates the selection beside itself', async ({ page }) => {
    const studio = new StudioPage(page)
    const before = await studio.nodeCount()

    await studio.clickLayer(HEADING)
    await studio.press('Mod+d')

    await expect.poll(() => studio.nodeCount()).toBe(before + 1)
    // The copy is selected, so the next edit lands on it — the reason duplicate is one keystroke.
    await expect.poll(() => studio.selectionLabel()).toContain('selected')
  })

  test('copies and pastes a node, and says how many blocks arrived', async ({ page }) => {
    const studio = new StudioPage(page)
    const before = await studio.nodeCount()

    await studio.clickLayer(HEADING)
    await studio.press('Mod+c')
    await studio.press('Mod+v')

    await expect.poll(() => studio.nodeCount()).toBe(before + 1)
    // The announcer carries the command and its outcome — the wording is the store's, so the
    // assertion is on the fact being announced rather than on a sentence a rewrite would break.
    await expect(page.getByTestId('command-announcer')).toContainText('Paste')
  })

  test('cuts a node out and pastes it back', async ({ page }) => {
    const studio = new StudioPage(page)
    const before = await studio.nodeCount()

    await studio.clickLayer(HEADING)
    await studio.press('Mod+x')
    await expect.poll(() => studio.nodeCount()).toBe(before - 1)

    await studio.press('Mod+v')
    await expect.poll(() => studio.nodeCount()).toBe(before)
  })

  test('undoes a paste in one step, however many nodes it brought', async ({ page }) => {
    const studio = new StudioPage(page)
    const before = await studio.nodeCount()

    /*
     * The grid, which carries two children — so the paste is a subtree rather than a single node.
     * The selection is cleared before pasting: `resolvePasteTarget` puts a copy beside the selection,
     * and a container cannot be pasted into itself, so pasting with the grid still selected is a
     * no-op that would make this spec pass by measuring nothing.
     */
    await studio.clickLayer('node_f002')
    await studio.press('Mod+c')
    await page.keyboard.press('Escape')
    await studio.press('Mod+v')

    const pasted = await studio.nodeCount()

    expect(pasted).toBeGreaterThan(before + 1)

    await studio.press('Mod+z')
    await expect.poll(() => studio.nodeCount()).toBe(before)
  })
})
