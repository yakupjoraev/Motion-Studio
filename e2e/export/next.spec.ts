import { expect, test } from '@playwright/test'

import { ExportPage } from '../fixtures/export-page'
import { StudioPage } from '../fixtures/studio-page'

/**
 * EXPORT_ENGINE.md § Next: the target whose output is a **project** rather than a component set.
 *
 * What makes it a project is the files nobody wrote a block for — a layout, a stylesheet, a
 * `package.json`, a tsconfig — and their absence is the failure mode: a component tree that compiles
 * in the studio's own repository and nowhere else.
 */
const FIXTURE = 'export-landing'

/** The scaffold `printNext` is responsible for, beside whatever components the document needs. */
const PROJECT = [
  'app/layout.tsx',
  'app/page.tsx',
  'app/globals.css',
  'package.json',
  'postcss.config.mjs',
  'tsconfig.json',
  'README.md',
]

test.beforeEach(async ({ page }) => {
  await new StudioPage(page).open(FIXTURE)
})

test('the file list is a project', async ({ page }) => {
  const exportPage = new ExportPage(page)

  await exportPage.open()
  await exportPage.chooseTarget('Next.js')
  await exportPage.settled()

  const paths = await exportPage.paths()

  for (const expected of PROJECT) {
    expect(paths).toContain(expected)
  }
})

test('the page composes the components rather than inlining them', async ({ page }) => {
  const exportPage = new ExportPage(page)

  await exportPage.open()
  await exportPage.chooseTarget('Next.js')
  await exportPage.settled()
  await exportPage.selectFile('app/page.tsx')

  const source = await exportPage.shownFile()

  // The entry point is a composition: imports from `@/components` and a body of elements. A page that
  // carried the markup itself would compile too, and would be unreadable at sixty nodes.
  expect(source).toContain("from '@/components/")
  // `export default function <RootName>()` — the printer names the entry after the document's root
  // node, so the assertion is on the shape rather than on a name a rename would move.
  expect(source).toMatch(/export default function \w+\(\)/)
})
