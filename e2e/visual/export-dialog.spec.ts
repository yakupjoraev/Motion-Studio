import { expect, test } from '@playwright/test'

import { ExportPage } from '../fixtures/export-page'
import { settled } from '../fixtures/settle'
import { StudioPage } from '../fixtures/studio-page'

/**
 * The export dialog, open over the studio — `prompts/45`.
 *
 * It earns a shot of its own because it is the densest surface in the product: a target picker, a
 * file tree, a code viewer, an options panel and a status line, all inside a scrim over the canvas.
 * Four of those five are surfaces a token change moves, and the fifth is the one that says how long
 * the print took.
 *
 * The document is the committed export fixture, so the tree lists the same files every run — the
 * dialog's own determinism problem, and the reason this is not a shot of an arbitrary document.
 */
const FIXTURE = 'export-landing'

test('the export dialog over the canvas', async ({ page }) => {
  const studio = new StudioPage(page)
  const exportPage = new ExportPage(page)

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await studio.open(FIXTURE)
  await exportPage.open()

  // Not the open, but the print: the tree is drawn empty first, and a shot taken on the frame would
  // capture a dialog mid-generation — which is a different picture every run.
  await exportPage.settled()
  await settled(page)

  await expect(page).toHaveScreenshot('export-dialog.png', {
    // The status line reports elapsed milliseconds, which is a measurement and never twice the same.
    mask: [exportPage.status()],
  })
})
