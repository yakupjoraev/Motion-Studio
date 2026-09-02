import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import type { Page } from '@playwright/test'

const ROOT = join(process.cwd(), '..')

/**
 * One story, in isolation, with the theme and colour mode it is to be painted in.
 *
 * The globals are the same ones `scripts/generate-thumbnails.mjs` drives, because it is the same
 * surface: a story that renders any block from the registry, so a block added later is screenshotted
 * without anybody writing a story for it.
 */
export const storyUrl = (
  id: string,
  { theme, mode, args }: { theme?: string; mode?: 'light' | 'dark'; args?: string } = {},
): string => {
  const globals = [
    theme === undefined ? '' : `theme:${theme}`,
    mode === undefined ? '' : `colorMode:${mode}`,
  ]
    .filter((part) => part !== '')
    .join(';')

  return `/iframe.html?id=${id}${globals === '' ? '' : `&globals=${globals}`}${
    args === undefined ? '' : `&args=${args}`
  }`
}

/**
 * Every block that has `previewProps` — read off the definitions on disk rather than imported.
 *
 * `e2e` depends on no workspace package (TESTING.md § E2E tests), and a list typed out here would
 * drift from the registry the first time a block was added. The shape read is the one `defineBlock`
 * requires: `id: blockId('...')` — branded, and therefore unambiguous, where a bare `id:` also
 * matches the ids inside a block's own slots and controls.
 */
export const previewableBlocks = (): readonly string[] => {
  const found: string[] = []

  const walk = (directory: string): void => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name)

      if (entry.isDirectory()) {
        walk(path)

        continue
      }

      if (!entry.name.endsWith('.definition.ts')) {
        continue
      }

      const source = readFileSync(path, 'utf8')

      if (!source.includes('previewProps')) {
        continue
      }

      const id = /\bid:\s*blockId\('([a-z0-9-]+)'\)/.exec(source)?.[1]

      if (id !== undefined) {
        found.push(id)
      }
    }
  }

  walk(join(ROOT, 'packages', 'blocks', 'src'))

  return found.sort()
}

/** The ten shipped presets, by id, in the order `presets.ts` declares them. */
export const themePresets = (): readonly string[] => {
  const source = readFileSync(
    join(ROOT, 'packages', 'theme', 'src', 'presets', 'presets.ts'),
    'utf8',
  )

  return [...source.matchAll(/^\s{2}id:\s*'([a-z0-9-]+)'/gm)].map((match) => match[1] ?? '')
}

interface StoryEntry {
  readonly id: string
  readonly title: string
  readonly name: string
}

/**
 * The stories a built Storybook publishes, from its own index.
 *
 * The index is what Storybook itself routes on, so a control whose stories are renamed is followed
 * rather than missed — and a control added without stories is visible as an absence.
 */
export const storyIndex = (): readonly StoryEntry[] => {
  const index = JSON.parse(
    readFileSync(join(ROOT, 'apps', 'storybook', 'storybook-static', 'index.json'), 'utf8'),
  ) as { entries: Record<string, StoryEntry> }

  return Object.values(index.entries)
}

/**
 * Waits for everything a screenshot depends on that is not the page being "loaded".
 *
 * Fonts first: a shot taken before `document.fonts.ready` captures the fallback face, and the diff
 * against a baseline taken after it is every glyph on the page. Then two frames, which is one to run
 * the commit a late chunk scheduled and one to be after it.
 */
export const readyForShot = async (page: Page): Promise<void> => {
  await page.evaluate(() => document.fonts.ready.then(() => true))
  await page.evaluate(
    () =>
      new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve(null)))
      }),
  )
}
