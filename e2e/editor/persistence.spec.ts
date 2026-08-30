import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { type Page, expect, test } from '@playwright/test'

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

const openStudio = async (page: Page): Promise<void> => {
  await page.goto('/studio')
  await page.waitForSelector('[data-testid="canvas-root"]')
}

const nodeCount = (page: Page): Promise<number> => page.locator('[data-node-id]').count()

/**
 * The palette's own insert path: a double click, which is what `block-card` binds beside the drag.
 * Returns the node count afterwards, because that count is what every reload assertion compares to.
 */
const insertFirstBlock = async (page: Page): Promise<number> => {
  const before = await nodeCount(page)
  const card = page.getByTestId('block-card').first()

  await card.waitFor()
  await card.dblclick()
  await expect(page.locator('[data-node-id]')).toHaveCount(before + 1)

  return before + 1
}

const openFileMenu = async (page: Page): Promise<void> => {
  await page.getByRole('button', { name: 'File' }).click()
}

const chooseFile = async (page: Page, name: string, contents: string): Promise<void> => {
  await openFileMenu(page)
  await page.getByRole('menuitem', { name: 'Import a document' }).click()
  await page.locator('input[type="file"]').setInputFiles({
    name,
    mimeType: 'application/json',
    buffer: Buffer.from(contents, 'utf8'),
  })
}

test.describe('persistence', () => {
  test('a debounced autosave survives a reload', async ({ page }) => {
    await openStudio(page)

    const expected = await insertFirstBlock(page)

    // Past the two-second debounce, with a second of margin for the write itself.
    await page.waitForTimeout(3000)
    await page.reload()
    await page.waitForSelector('[data-testid="canvas-root"]')

    await expect(page.locator('[data-node-id]')).toHaveCount(expected)
  })

  test('a reload inside the debounce window loses nothing', async ({ page }) => {
    await openStudio(page)

    const expected = await insertFirstBlock(page)

    // No wait: the unload lane is the only thing that can carry this edit — ADR-285.
    await page.reload()
    await page.waitForSelector('[data-testid="canvas-root"]')

    await expect(page.locator('[data-node-id]')).toHaveCount(expected)
  })

  test('a valid .motion file opens', async ({ page }) => {
    await openStudio(page)
    await chooseFile(page, 'waitlist.motion.json', readTemplate('waitlist'))

    await page.getByRole('button', { name: 'Continue' }).click()

    await expect(page.locator('[data-node-id]').first()).toBeVisible()
    expect(await nodeCount(page)).toBeGreaterThan(1)
  })

  test('a file with orphans reports its repairs and still opens', async ({ page }) => {
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

    await openStudio(page)
    await chooseFile(page, 'orphaned.motion.json', JSON.stringify(orphan))

    await expect(page.getByTestId('import-report')).toContainText('2 orphan blocks removed')
    await expect(page.getByRole('button', { name: 'Download original' })).toBeVisible()

    await page.getByRole('button', { name: 'Continue' }).click()

    // Usable afterwards, not merely loaded: the canvas takes a selection on the repaired document.
    await page.locator('[data-node-id]').nth(1).click()
    await expect(page.getByTestId('selection-chip')).toBeVisible()
  })

  test('a file with a cycle is refused, with a reason and the file back', async ({ page }) => {
    const source = JSON.parse(readTemplate('waitlist'))
    const [firstChild] = source.nodes[source.rootId].children
    const cyclic = {
      ...source,
      nodes: {
        ...source.nodes,
        [firstChild]: { ...source.nodes[firstChild], children: [source.rootId] },
      },
    }

    await openStudio(page)
    const before = await nodeCount(page)

    await chooseFile(page, 'cyclic.motion.json', JSON.stringify(cyclic))

    await expect(page.getByTestId('import-rejection')).toContainText('loop')
    await expect(page.getByRole('button', { name: 'Download original' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Continue' })).toHaveCount(0)

    await page.getByRole('button', { name: 'Try another file' }).click()
    await page.keyboard.press('Escape')

    expect(await nodeCount(page)).toBe(before)
  })

  test('malformed JSON reads as an error and leaves the document alone', async ({ page }) => {
    await openStudio(page)

    const expected = await insertFirstBlock(page)

    await chooseFile(page, 'broken.motion.json', '{\n  "version": 1,\n  oops\n}')

    await expect(page.getByTestId('import-rejection')).toContainText('Not valid JSON (line 3)')

    await page.keyboard.press('Escape')

    await expect(page.locator('[data-node-id]')).toHaveCount(expected)
  })

  test('every shipped template opens and can be edited', async ({ page }) => {
    await openStudio(page)

    for (const slug of templateSlugs()) {
      await openFileMenu(page)
      await page.getByRole('menuitem', { name: 'New' }).click()
      await page.getByTestId(`template-${slug}`).click()

      const node = page.locator('[data-node-id]').nth(1)

      await expect(node, `${slug} put nodes on the canvas`).toBeVisible()

      await node.click()
      await expect(page.getByTestId('selection-chip'), `${slug} is editable`).toBeVisible()
    }
  })
})
