import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { expect, test } from '@playwright/test'

import { ExportPage } from '../fixtures/export-page'
import { StudioPage } from '../fixtures/studio-page'

/**
 * FILE_FORMAT.md § Round trip: what comes out of the JSON target parses back into the document that
 * went in.
 *
 * The comparison is against the **committed** fixture rather than against a second export, which is
 * what makes it a round trip rather than a tautology: a loader and a printer that agree on a mistake
 * would pass an export-to-export comparison forever.
 */
const FIXTURE = 'export-landing'

const here = dirname(fileURLToPath(import.meta.url))

/** `meta.updatedAt` is the one field a load is allowed to move, so it is left out of the compare. */
const withoutTime = (document: Record<string, unknown>): unknown => {
  const { updatedAt, ...meta } = document['meta'] as Record<string, unknown>

  return { ...document, meta, stamped: typeof updatedAt === 'string' }
}

test.beforeEach(async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await new StudioPage(page).open(FIXTURE)
})

test('what comes out parses back into the document that went in', async ({ page }) => {
  const exportPage = new ExportPage(page)

  await exportPage.open()
  await exportPage.chooseTarget('JSON')
  await exportPage.settled()

  const copied = await exportPage.copyShownFile()
  const exported = JSON.parse(copied) as Record<string, unknown>
  const committed = JSON.parse(
    readFileSync(join(here, '..', 'fixtures', 'documents', `${FIXTURE}.motion.json`), 'utf8'),
  ) as Record<string, unknown>

  expect(withoutTime(exported)).toEqual(withoutTime(committed))
})

test('an edit made in the studio is in the exported document', async ({ page }) => {
  const studio = new StudioPage(page)
  const exportPage = new ExportPage(page)

  await studio.selectNode('heading')
  await studio.inspector.setControl('Text', 'Round tripped')

  await exportPage.open()
  await exportPage.chooseTarget('JSON')
  await exportPage.settled()

  const exported = JSON.parse(await exportPage.copyShownFile()) as {
    nodes: Record<string, { props?: Record<string, unknown> }>
  }
  const values = Object.values(exported.nodes).flatMap((node) =>
    Object.values(node.props ?? {}).filter((value): value is string => typeof value === 'string'),
  )

  // The exporter serialises the live document, not the one that was loaded — the failure this
  // catches is a JSON target that re-prints the fixture it opened with.
  expect(values).toContain('Round tripped')
})
