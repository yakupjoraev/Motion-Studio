import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { expect, test } from '@playwright/test'

import { settled } from '../fixtures/settle'
import { StudioPage } from '../fixtures/studio-page'

/**
 * The promise the whole subsystem exists to keep — `prompts/50`: "a crash, a refresh, or a bad file
 * must never lose the user's work." Every scenario here is that sentence in one of its forms.
 *
 * Unlike the other editor specs, these open `/studio` with no `?fixture=`: a fixture session neither
 * restores nor autosaves (ADR-286), so a spec about persistence has to build its document the way a
 * person does.
 */
const TEMPLATES = join(process.cwd(), '..', 'apps', 'web', 'public', 'templates')

const templateSlugs = (): readonly string[] =>
  readdirSync(TEMPLATES)
    .filter((name) => name.endsWith('.motion.json'))
    .map((name) => name.replace('.motion.json', ''))

const readTemplate = (slug: string): string =>
  readFileSync(join(TEMPLATES, `${slug}.motion.json`), 'utf8')

test.describe('persistence', () => {
  let studio: StudioPage

  test.beforeEach(async ({ page }) => {
    studio = new StudioPage(page)

    await studio.openEmpty()
  })

  /** One block in, and the count it left behind — what every reload assertion compares against. */
  const insertOne = async (): Promise<number> => {
    const before = await studio.canvas.count()

    await studio.palette.insertFirst()
    await studio.canvas.expectNodeCount(before + 1)

    return before + 1
  }

  test('a debounced autosave survives a reload', async ({ page }) => {
    const expected = await insertOne()

    // Past the two-second debounce, with a second of margin for the write itself.
    await settled(page)
    await page.reload()
    await studio.canvas.root().waitFor()

    await studio.canvas.expectNodeCount(expected)
  })

  test('a reload inside the debounce window loses nothing', async ({ page }) => {
    const expected = await insertOne()

    // No wait: the unload lane is the only thing that can carry this edit — ADR-285.
    await page.reload()
    await studio.canvas.root().waitFor()

    await studio.canvas.expectNodeCount(expected)
  })

  test('a valid .motion file opens', async () => {
    const dialog = await studio.file.importFile('waitlist.motion.json', readTemplate('waitlist'))

    await dialog.accept()

    await expect(studio.canvas.nodes().first()).toBeVisible()
    expect(await studio.canvas.count()).toBeGreaterThan(1)
  })

  test('a file with orphans reports its repairs and still opens', async () => {
    const source = JSON.parse(readTemplate('changelog'))
    const orphan = {
      ...source,
      nodes: {
        ...source.nodes,
        node_orphanone: {
          ...source.nodes[source.rootId],
          id: 'node_orphanone',
          parentId: null,
          children: [],
        },
        node_orphantwo: {
          ...source.nodes[source.rootId],
          id: 'node_orphantwo',
          parentId: null,
          children: [],
        },
      },
    }

    const dialog = await studio.file.importFile('orphaned.motion.json', JSON.stringify(orphan))

    await expect(dialog.report()).toContainText('2 orphan blocks removed')
    await expect(dialog.downloadOriginal()).toBeVisible()

    await dialog.accept()

    // Usable afterwards, not merely loaded: the canvas takes a selection on the repaired document.
    await studio.canvas.selectNth(1)
    await expect(studio.canvas.selectionChip()).toBeVisible()
  })

  test('a file with a cycle is refused, with a reason and the file back', async () => {
    const source = JSON.parse(readTemplate('waitlist'))
    const [firstChild] = source.nodes[source.rootId].children
    const cyclic = {
      ...source,
      nodes: {
        ...source.nodes,
        [firstChild]: { ...source.nodes[firstChild], children: [source.rootId] },
      },
    }

    const before = await studio.canvas.count()
    const dialog = await studio.file.importFile('cyclic.motion.json', JSON.stringify(cyclic))

    await expect(dialog.rejection()).toContainText('loop')
    await expect(dialog.downloadOriginal()).toBeVisible()
    await expect(dialog.continueButton()).toHaveCount(0)

    await dialog.tryAnotherFile()
    await dialog.dismiss()

    expect(await studio.canvas.count()).toBe(before)
  })

  test('malformed JSON reads as an error and leaves the document alone', async () => {
    const expected = await insertOne()
    const dialog = await studio.file.importFile(
      'broken.motion.json',
      '{\n  "version": 1,\n  oops\n}',
    )

    await expect(dialog.rejection()).toContainText('Not valid JSON (line 3)')

    await dialog.dismiss()

    await studio.canvas.expectNodeCount(expected)
  })

  /**
   * 400 px, set before the measurement and after one real defect: the pricing page shipped a 400 px
   * void between its promise and its plans, which is what this number is drawn from. Measured across
   * the eight at 1280 px, the largest honest gap is 324 px — a hero handing over to the next section,
   * which is where a page should breathe most.
   */
  const MAX_EMPTY_RUN = 400

  test('every shipped template opens, reads as a page, and can be edited', async () => {
    await studio.inspector.setBreakpoint('xl')

    for (const slug of templateSlugs()) {
      await studio.file.newFromTemplate(slug)

      const node = studio.canvas.nodes().nth(1)

      await expect(node, `${slug} put nodes on the canvas`).toBeVisible()

      await studio.canvas.selectNth(1)
      await expect(studio.canvas.selectionChip(), `${slug} is editable`).toBeVisible()

      expect(await studio.canvas.largestEmptyRun(), `${slug} has a hole in it`).toBeLessThan(
        MAX_EMPTY_RUN,
      )
    }
  })
})
