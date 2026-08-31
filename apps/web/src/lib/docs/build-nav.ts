import { type DocEntry, readDocs } from './read-docs'

/**
 * The five groups, in the order the index reads. `docs/README.md`'s tables are generated from this
 * order by `pnpm generate:docs-index`, and `build-nav.test.ts` asserts the two agree — so a group
 * added here without regenerating the index fails, and the reverse fails too.
 */
export const GROUP_ORDER = [
  'Product',
  'Engineering foundations',
  'Design',
  'Subsystems',
  'Quality',
] as const

export interface NavItem {
  readonly href: string
  readonly label: string
  readonly summary: string
  readonly slug: string
}

export interface NavGroup {
  readonly title: string
  readonly items: readonly NavItem[]
}

const itemOf = (entry: DocEntry): NavItem => ({
  href: entry.href,
  label: entry.fileName,
  summary: entry.frontmatter?.summary ?? '',
  slug: entry.slug,
})

export function buildNav(entries: readonly DocEntry[] = readDocs()): readonly NavGroup[] {
  const grouped = new Map<string, DocEntry[]>()

  for (const entry of entries) {
    const group = entry.frontmatter?.group

    if (group === undefined) {
      continue
    }

    if (!GROUP_ORDER.includes(group as (typeof GROUP_ORDER)[number])) {
      throw new Error(`${entry.fileName}: "${group}" is not one of the five index groups`)
    }

    const bucket = grouped.get(group)

    if (bucket === undefined) {
      grouped.set(group, [entry])
    } else {
      bucket.push(entry)
    }
  }

  return GROUP_ORDER.map((title) => {
    const bucket = [...(grouped.get(title) ?? [])].sort(
      (a, b) => (a.frontmatter?.order ?? 0) - (b.frontmatter?.order ?? 0),
    )

    const orders = bucket.map((entry) => entry.frontmatter?.order ?? 0)

    if (new Set(orders).size !== orders.length) {
      throw new Error(`${title}: two documents claim the same order`)
    }

    return { title, items: bucket.map(itemOf) }
  })
}

/** Index first, then the nav's own order — which is what previous/next has to agree with. */
export function readingOrder(entries: readonly DocEntry[] = readDocs()): readonly DocEntry[] {
  const bySlug = new Map(entries.map((entry) => [entry.slug, entry]))
  const ordered: DocEntry[] = []
  const index = bySlug.get('')

  if (index !== undefined) {
    ordered.push(index)
  }

  for (const group of buildNav(entries)) {
    for (const item of group.items) {
      const entry = bySlug.get(item.slug)

      if (entry !== undefined) {
        ordered.push(entry)
      }
    }
  }

  return ordered
}

export interface Neighbours {
  readonly previous: DocEntry | undefined
  readonly next: DocEntry | undefined
}

export function neighboursOf(slug: string, entries: readonly DocEntry[] = readDocs()): Neighbours {
  const order = readingOrder(entries)
  const at = order.findIndex((entry) => entry.slug === slug)

  return { previous: order[at - 1], next: order[at + 1] }
}
