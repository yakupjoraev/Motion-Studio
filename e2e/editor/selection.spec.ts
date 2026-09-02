import { expect, test } from '@playwright/test'

import { StudioPage } from '../fixtures/studio-page'

/**
 * EDITOR_ENGINE.md § Selection and SHORTCUTS.md § Selection, in a browser.
 *
 * The unit tests own the selection reducer and prove what it computes. What they cannot show is that
 * the three surfaces agree about it: a row in the tree, an outline on the canvas and a line in the
 * status bar are three readers of one array, and a selection that only one of them believes in is the
 * defect this file is for.
 */
const FIXTURE = 'responsive-grid'

/** `responsive-grid`: Container → Grid → (Heading, Text). Two siblings is the smallest real case. */
const GRID = 'node_f002'
const HEADING = 'node_f003'
const TEXT = 'node_f004'

test.describe('selecting nodes', () => {
  test.beforeEach(async ({ page }) => {
    await new StudioPage(page).open(FIXTURE)
  })

  test('names one node, counts several, and says nothing about none', async ({ page }) => {
    const studio = new StudioPage(page)

    await studio.layers.click(HEADING)
    await expect.poll(() => studio.selectionLabel()).toBe('Heading selected')

    await studio.layers.click(TEXT, ['Shift'])
    await expect.poll(() => studio.selectionLabel()).toBe('2 selected')

    // Esc clears the selection — SHORTCUTS.md § Global, the same key that closes an overlay. The
    // status bar says so in words rather than going blank, which is the phrasing a reader is given.
    await page.keyboard.press('Escape')
    await expect.poll(() => studio.selectionLabel()).toBe('No selection')
  })

  test('toggles one node out of a selection without touching the rest', async ({ page }) => {
    const studio = new StudioPage(page)
    const modifier = await studio.modifier()

    await studio.layers.click(HEADING)
    await studio.layers.click(TEXT, ['Shift'])
    await expect.poll(() => studio.selectionLabel()).toBe('2 selected')

    // Mod+Click toggles rather than replaces, which is the difference from a plain click.
    await studio.layers.click(TEXT, [modifier === 'Meta' ? 'Meta' : 'Control'])
    await expect.poll(() => studio.selectionLabel()).toBe('Heading selected')
  })

  test('selects the level, which is the isolation and not the selected node', async ({ page }) => {
    const studio = new StudioPage(page)

    await studio.layers.click(HEADING)
    await studio.press('Mod+a')

    /*
     * "The siblings at the current level" means the children of the isolation — `selectAll` reads
     * `isolationId ?? rootId` — so with nothing isolated it is the root's children, whatever is
     * selected at the time. Heading is three levels down and `Mod+A` still answers Grid. Reading it
     * as "the siblings of the selection" is the mistake this spec is written against: four nodes
     * would be the whole document, and two would be a rule the store does not implement.
     */
    await expect.poll(() => studio.selectionLabel()).toBe('Grid selected')

    await studio.press('Mod+Shift+a')
    await expect.poll(() => studio.selectionLabel()).toBe('No selection')
  })

  test('walks to the parent and back down to a child', async ({ page }) => {
    const studio = new StudioPage(page)

    await studio.layers.click(HEADING)
    await studio.press('Mod+Shift+ArrowUp')
    await expect.poll(() => studio.selectionLabel()).toBe('Grid selected')

    await studio.press('Mod+Shift+ArrowDown')
    await expect.poll(() => studio.selectionLabel()).toBe('Heading selected')
  })

  test('marks the selected row in the tree, and only that row', async ({ page }) => {
    const studio = new StudioPage(page)

    await studio.layers.click(GRID)

    await expect(studio.layers.selectedRows()).toHaveCount(1)
    await expect(studio.layers.row(GRID)).toHaveAttribute('data-selected', 'true')
  })
})
