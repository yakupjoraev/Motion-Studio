import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  type UiverseCategory,
  type UiverseElement,
  type UiverseIndex,
  type UiverseViews,
  isUiverseCategory,
} from './catalogue.types'

/**
 * **Server side only.** The catalogue is 12 MB of markup and CSS across eleven files, so it is read
 * from disk when a page is rendered rather than bundled: a client component that imported this would
 * put the whole library in the browser's first load, and `/studio` has 250 KiB to spend in total.
 *
 * The files are the import's output and are committed, so reading them needs no build step — but a
 * missing one is an error rather than an empty list, because "no elements" and "the import has not
 * run" are different answers and returning the same empty array for both is how a catalogue quietly
 * disappears from a page.
 */
const DATA = join(dirname(fileURLToPath(import.meta.url)), '..', 'data')

const read = <T>(file: string): T => {
  const path = join(DATA, file)

  if (!existsSync(path)) {
    throw new Error(`${file} is missing — run \`pnpm tsx scripts/import-uiverse.ts <clone>\``)
  }

  return JSON.parse(readFileSync(path, 'utf8')) as T
}

export const readIndex = (): UiverseIndex => read<UiverseIndex>('index.json')

export const readCategory = (category: UiverseCategory): readonly UiverseElement[] =>
  read<UiverseElement[]>(`${category}.json`)

/**
 * Every element, in the order the categories are declared. It is the whole 12 MB, so it exists for
 * counting and cross-category search rather than for rendering a page.
 */
export const readAll = (): readonly UiverseElement[] =>
  readIndex().categories.flatMap((summary) => readCategory(summary.category))

/**
 * View counts, when they have been collected — the catalogue ships without them and
 * `scripts/enrich-uiverse-views.ts` writes them separately, so a page that sorts by popularity has
 * to survive their absence rather than assume it.
 */
export const readViews = (): UiverseViews | null => {
  const path = join(DATA, 'views.json')

  return existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as UiverseViews) : null
}

export interface RankedElement {
  readonly element: UiverseElement
  /** `null` when this element has no collected count, which sorts it below every element that has. */
  readonly views: number | null
}

/**
 * A category ordered by how much the site has seen it, most first. Elements with no count keep their
 * alphabetical order at the end: an unknown number is not a zero, and pretending it is would rank a
 * newly published element below a rejected one.
 */
export const rankCategory = (
  category: UiverseCategory,
  views: UiverseViews | null,
): readonly RankedElement[] => {
  const counts = views?.views ?? {}

  return readCategory(category)
    .map((element) => ({ element, views: counts[element.id] ?? null }))
    .sort((a, b) => {
      if (a.views === b.views) {
        return a.element.id.localeCompare(b.element.id)
      }

      if (a.views === null) {
        return 1
      }

      if (b.views === null) {
        return -1
      }

      return b.views - a.views
    })
}

export const categoryOf = (id: string): UiverseCategory | null => {
  const category = id.split('/')[0] ?? ''

  return isUiverseCategory(category) ? category : null
}
