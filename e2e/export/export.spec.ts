import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { expect, test } from '@playwright/test'
import JSZip from 'jszip'

import { ExportPage } from '../fixtures/export-page'
import { StudioPage } from '../fixtures/studio-page'

/** The sixty-node landing: the document the export decision was measured on. */
const FIXTURE = 'export-landing'

const here = dirname(fileURLToPath(import.meta.url))

/** These specs exist partly to produce numbers, so the numbers are written where a run shows them. */
const report = (line: string): void => {
  process.stdout.write(`  export: ${line}
`)
}

test.beforeEach(async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await new StudioPage(page).open(FIXTURE)
})

test('React: the dialog opens, files stream in, and a copy lands on the clipboard', async ({
  page,
}) => {
  const exportPage = new ExportPage(page)

  const opened = await exportPage.openWithinOneFrame()

  // In the DOM in the frame of the click, with no file in it: the dialog does not wait on the
  // pipeline, which is the difference between a tool and a build step. `frameMs` is reported rather
  // than asserted — it measures when the next frame boundary arrived, not when the dialog did.
  expect(opened.visible).toBe(true)
  expect(opened.files).toBe(0)
  report(`dialog on screen at the next frame, ${opened.frameMs.toFixed(1)} ms after the click`)

  const paths = await exportPage.paths()

  expect(paths).toContain('index.ts')

  await exportPage.settled()
  await exportPage.selectFile('index.ts')

  const copied = await exportPage.copyShownFile()

  expect(copied.split('\n')[0]).toMatch(/^export \{ \w+ \} from '\.\//)
})

test('Next.js: the file list is a project', async ({ page }) => {
  const exportPage = new ExportPage(page)

  await exportPage.open()
  await exportPage.chooseTarget('Next.js')
  await exportPage.settled()

  const paths = await exportPage.paths()

  for (const expected of [
    'app/layout.tsx',
    'app/page.tsx',
    'app/globals.css',
    'package.json',
    'postcss.config.mjs',
    'tsconfig.json',
    'README.md',
  ]) {
    expect(paths).toContain(expected)
  }
})

test('HTML: one self-contained document', async ({ page }) => {
  const exportPage = new ExportPage(page)

  await exportPage.open()
  await exportPage.chooseTarget('HTML')
  await exportPage.settled()

  expect(await exportPage.paths()).toEqual(['index.html'])

  const copied = await exportPage.copyShownFile()

  expect(copied).toContain('<!doctype html>')
  expect(copied).toContain('<style>')
})

test('JSON: what comes out parses back into the document that went in', async ({ page }) => {
  const exportPage = new ExportPage(page)

  await exportPage.open()
  await exportPage.chooseTarget('JSON')
  await exportPage.settled()

  const copied = await exportPage.copyShownFile()
  const exported = JSON.parse(copied) as Record<string, unknown>
  const committed = JSON.parse(
    readFileSync(join(here, '..', 'fixtures', 'documents', `${FIXTURE}.motion.json`), 'utf8'),
  ) as Record<string, unknown>

  // `meta.updatedAt` is the one field a load is allowed to move, so it is left out of the comparison.
  const withoutTime = (document: Record<string, unknown>): unknown => {
    const { updatedAt, ...meta } = document['meta'] as Record<string, unknown>

    return { ...document, meta, stamped: typeof updatedAt === 'string' }
  }

  expect(withoutTime(exported)).toEqual(withoutTime(committed))
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

test('Zip: the archive holds the files the tree listed', async ({ page }) => {
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

  const trigger = page.getByRole('button', { name: /^Export/ })

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
