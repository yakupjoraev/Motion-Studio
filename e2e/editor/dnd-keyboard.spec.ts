import { expect, test } from '@playwright/test'

import { StudioPage } from '../fixtures/studio-page'

/**
 * DRAG_AND_DROP.md § Keyboard, in a browser.
 *
 * The reorder shortcut rather than the drag: `a11y/keyboard-drag` covers what the drag itself
 * announces and records, in ACCESSIBILITY.md § Known limitations, which part of it does not move a
 * node yet (ADR-327). This file is about the path that *does* reorder a document without a pointer,
 * because that is the one a keyboard user is told to use.
 */
const FIXTURE = 'responsive-grid'

const TEXT = 'node_f004'

test.describe('reordering without a pointer', () => {
  test.beforeEach(async ({ page }) => {
    await new StudioPage(page).open(FIXTURE)
  })

  test('moves a row up and back down again with the reorder shortcut', async ({ page }) => {
    const studio = new StudioPage(page)

    const before = await studio.layers.names()

    await studio.layers.click(TEXT)
    await studio.layers.focus(TEXT)
    await studio.press('Mod+ArrowUp')

    await expect.poll(() => studio.layers.names()).not.toEqual(before)

    // Focused again: the row is re-rendered at its new index and the virtual window hands the DOM
    // node to a different position, so the element that had focus is not the one that has it now.
    await studio.layers.focus(TEXT)
    await studio.press('Mod+ArrowDown')

    // Back to where it started: the shortcut is its own inverse, which is what makes it usable
    // without a preview of where the row is going.
    await expect.poll(() => studio.layers.names()).toEqual(before)
  })

  test('inserts a block from the palette with the keyboard alone', async ({ page }) => {
    const studio = new StudioPage(page)
    const before = await studio.nodeCount()

    await studio.palette.insertByKeyboard('badge')

    await expect.poll(() => studio.nodeCount()).toBe(before + 1)
  })

  test('announces what the reorder did', async ({ page }) => {
    const studio = new StudioPage(page)

    await studio.layers.click(TEXT)
    await studio.layers.focus(TEXT)
    await studio.press('Mod+ArrowUp')

    // A move nobody is told about is a move a screen-reader user cannot verify — ADR-326.
    await expect(studio.announcer()).not.toBeEmpty()
  })
})
