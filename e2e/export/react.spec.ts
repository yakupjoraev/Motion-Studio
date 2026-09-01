import { expect, test } from '@playwright/test'
import JSZip from 'jszip'

import { ExportPage } from '../fixtures/export-page'
import { StudioPage } from '../fixtures/studio-page'

/**
 * EXPORT_ENGINE.md § React, and the dialog itself.
 *
 * React is the target the dialog opens on, so the behaviours that belong to no particular target —
 * the archive, the regeneration an option toggle causes, the keyboard path in and out — are exercised
 * here rather than repeated in the other three files.
 */
const FIXTURE = 'export-landing'

/** These specs exist partly to produce numbers, so the numbers are written where a run shows them. */
const report = (line: string): void => {
  process.stdout.write(`  export: ${line}
`)
}

test.beforeEach(async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await new StudioPage(page).open(FIXTURE)
})

test('lists the files it printed and copies one to the clipboard', async ({ page }) => {
  const exportPage = new ExportPage(page)

  await exportPage.open()

  const paths = await exportPage.paths()

  expect(paths).toContain('index.ts')

  await exportPage.settled()
  await exportPage.selectFile('index.ts')

  const copied = await exportPage.copyShownFile()

  expect(copied.split('\n')[0]).toMatch(/^export \{ \w+ \} from '\.\//)
})

test('opening costs a render once the chunk is there', async ({ page }) => {
  const exportPage = new ExportPage(page)

  await exportPage.warmUp()

  const opened = await exportPage.openWithinOneFrame()

  /*
   * The promise in prompt 45 — "visible in the frame the button is pressed" — as ADR-313 left it: the
   * dialog's chunk is prefetched on idle and the component stays mounted after the first open, so the
   * click costs a render. `frameMs` is reported rather than asserted; it measures when the next frame
   * boundary arrived, which is a property of the browser's schedule and not of this code.
   */
  expect(opened.visible).toBe(true)
  report(`dialog on screen at the next frame, ${opened.frameMs.toFixed(1)} ms after the click`)
})

test('Copy React on a selection puts one component on the clipboard', async ({ page }) => {
  const exportPage = new ExportPage(page)

  await page.locator('[data-node-id]').nth(1).click()
  await page.keyboard.press('ControlOrMeta+Shift+KeyC')
  await expect(page.getByText(/^Copied /)).toBeVisible({ timeout: 30_000 })

  const copied = await exportPage.clipboard()

  expect(copied).toContain('export function')
  // One component, not an export: no barrel line and no second file's banner comment.
  expect(copied).not.toContain('export { ')
})

test('the archive holds the files the tree listed', async ({ page }) => {
  const exportPage = new ExportPage(page)

  await exportPage.open()
  await exportPage.settled()

  const paths = await exportPage.paths()
  const download = page.waitForEvent('download')

  await page.getByRole('button', { name: /Download \.zip/ }).click()

  const file = await download
  const stream = await file.createReadStream()
  const chunks: Buffer[] = []

  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk))
  }

  const archive = await JSZip.loadAsync(Buffer.concat(chunks))

  // JSZip synthesises a folder entry per path segment; the tree lists files.
  const entries = Object.values(archive.files)
    .filter((entry) => !entry.dir)
    .map((entry) => entry.name)

  expect(entries.sort()).toEqual([...paths].sort())
  expect(file.suggestedFilename()).toMatch(/^export-landing-\d{4}-\d{2}-\d{2}\.zip$/)
})

test('an option toggle regenerates, and the dialog says how long it took', async ({ page }) => {
  const exportPage = new ExportPage(page)

  await exportPage.open()
  await exportPage.settled()

  const first = await exportPage.elapsed()

  await exportPage.toggle('Theme')
  await expect(exportPage.status()).not.toContainText(`${first} ms`)
  await exportPage.settled()

  const second = await exportPage.elapsed()

  report(`${first} ms cold, ${second} ms after toggling Theme`)

  expect(second).toBeGreaterThan(0)
  // ADR-244's cache split: the reprint reuses the IR, so it is not slower than the first run.
  expect(second).toBeLessThanOrEqual(first * 1.5)
})

test('the whole dialog is reachable from the keyboard, and gives focus back', async ({ page }) => {
  const exportPage = new ExportPage(page)

  await page.getByTestId('shortcut-host').waitFor({ state: 'attached' })
  await page.locator('[data-node-id]').first().click()

  const trigger = page.getByTestId('export-button')

  await trigger.focus()
  await page.keyboard.press('ControlOrMeta+Shift+KeyE')
  await exportPage.settled()

  // The target group takes one tab stop and the arrow keys move inside it — ACCESSIBILITY.md § Radio
  // groups. Next.js is the second target, so one press is one target.
  await page.keyboard.press('Tab')
  await page.keyboard.press('ArrowDown')
  await expect(page.getByRole('radio', { name: /^Next\.js/ })).toBeChecked()
  await exportPage.settled()

  const row = exportPage.dialog().locator('[data-file-row]').first()

  await row.focus()
  await page.keyboard.press('ArrowDown')
  await expect(exportPage.dialog().locator('[data-file-row][aria-selected="true"]')).toHaveCount(1)

  await page.keyboard.press('Escape')
  await expect(exportPage.dialog()).toBeHidden()
  await expect(trigger).toBeFocused()
})
