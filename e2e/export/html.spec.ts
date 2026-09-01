import { expect, test } from '@playwright/test'

import { ExportPage } from '../fixtures/export-page'
import { StudioPage } from '../fixtures/studio-page'

/**
 * EXPORT_ENGINE.md § HTML: one file, no build step, no dependency.
 *
 * The target exists for the person who wants to open the result by double-clicking it, so the whole
 * assertion is self-containment — one path in the tree, and the styles inside the document rather
 * than beside it.
 */
const FIXTURE = 'export-landing'

test.beforeEach(async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await new StudioPage(page).open(FIXTURE)
})

test('one self-contained document', async ({ page }) => {
  const exportPage = new ExportPage(page)

  await exportPage.open()
  await exportPage.chooseTarget('HTML')
  await exportPage.settled()

  expect(await exportPage.paths()).toEqual(['index.html'])

  const copied = await exportPage.copyShownFile()

  expect(copied).toContain('<!doctype html>')
  expect(copied).toContain('<style>')
})

test('carries no import and no script tag pointing anywhere else', async ({ page }) => {
  const exportPage = new ExportPage(page)

  await exportPage.open()
  await exportPage.chooseTarget('HTML')
  await exportPage.settled()

  const copied = await exportPage.copyShownFile()

  // A `src` or an `href` to a second file would make the one-path list a lie: the file would open to
  // an unstyled page anywhere but the machine it was generated on.
  expect(copied).not.toMatch(/<script[^>]+\ssrc=/)
  expect(copied).not.toMatch(/<link[^>]+rel="stylesheet"/)
})
