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

  test('undoes a multi-node duplicate in one step', async ({ page }) => {
    const studio = new StudioPage(page)
    const before = await studio.nodeCount()

    /*
     * Duplicate rather than copy-and-paste, because the grid carries two children and this spec is
     * about the **history entry** rather than about where a paste lands. `resolvePasteTarget` refuses
     * to put a container inside itself and there is no second container in this fixture to aim at, so
     * a paste here would be a no-op that made the assertion pass by measuring nothing.
     */
    await studio.clickLayer('node_f002')
    await studio.press('Mod+d')

    const duplicated = await studio.nodeCount()

    expect(duplicated).toBe(before + 3)

    await studio.press('Mod+z')
    await expect.poll(() => studio.nodeCount()).toBe(before)
  })
})
