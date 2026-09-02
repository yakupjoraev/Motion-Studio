import { type Locator, type Page, expect, test } from '@playwright/test'

import { settled } from '../fixtures/settle'
import { StudioPage } from '../fixtures/studio-page'

/**
 * The studio's own chrome, in the three states it is read in — UI_GUIDELINES.md § Layout.
 *
 * Not the canvas' contents: the blocks have their own hundred and forty-four shots, and a document on
 * the artboard would put every one of them inside these three as well. What is under test here is the
 * frame — panel widths, the top bar, the status bar, the inspector's empty state, and the overlays a
 * selection draws.
 *
 * The fixture document is committed, so the canvas is the same four nodes on every run.
 */
const FIXTURE = 'responsive-grid'

/** The node the selection state selects, so the overlay is drawn around a known box. */
const GRID = 'node_f002'

const masked = (page: Page): Locator[] => [
  // The frame meter is a live number by definition — TESTING.md § Visual regression asks for a mask
  // rather than for the shot to be dropped, because everything around it is still worth watching.
  page.getByTestId('status-fps'),
]

test.describe('the studio chrome', () => {
  test('empty, with nothing selected', async ({ page }) => {
    const studio = new StudioPage(page)

    await page.emulateMedia({ reducedMotion: 'reduce' })
    await studio.openEmpty()
    await settled(page)

    await expect(page).toHaveScreenshot('empty.png', { mask: masked(page) })
  })

  test('with a node selected', async ({ page }) => {
    const studio = new StudioPage(page)

    await page.emulateMedia({ reducedMotion: 'reduce' })
    await studio.open(FIXTURE)
    await studio.layers.select(GRID)
    await studio.inspector.ready()
    await settled(page)

    await expect(page).toHaveScreenshot('selection.png', { mask: masked(page) })
  })

  test('with the layers tree showing a document', async ({ page }) => {
    const studio = new StudioPage(page)

    await page.emulateMedia({ reducedMotion: 'reduce' })
    await studio.open(FIXTURE)
    await studio.layers.open()
    await settled(page)

    await expect(page).toHaveScreenshot('layers.png', { mask: masked(page) })
  })
})
