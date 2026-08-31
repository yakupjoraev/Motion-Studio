import { plainText } from './frontmatter'
import { slugify } from './headings'
import { type DocEntry, readDocs } from './read-docs'

export interface SearchDoc {
  readonly file: string
  readonly href: string
  readonly title: string
  readonly summary: string
  readonly snippet: string
}

export interface SearchSection {
  /** Index into `docs`. A repeated file name would be a third of the payload. */
  readonly doc: number
  readonly text: string
  /**
   * Written only when the anchor is not `slugify(text)` — which happens when two headings in one
   * document collide. Storing it for all 597 sections cost 32 kB of a 60 kB budget, measured, and
   * the client derives it with the same function the anchors were built with.
   */
  readonly slug?: string
}

export const sectionSlug = (section: SearchSection): string => section.slug ?? slugify(section.text)

export interface SearchIndex {
  readonly docs: readonly SearchDoc[]
  readonly sections: readonly SearchSection[]
}

/** The budget is 60 kB for the whole index; a snippet is the only part that grows with prose. */
const SNIPPET_LIMIT = 180

const truncate = (text: string, limit: number): string =>
  text.length <= limit ? text : `${text.slice(0, limit - 1).trimEnd()}…`

/**
 * Documents and their `##` sections. Deeper headings are left out because 1724 of the corpus's 1724
 * `###` headings are ADR fields — "Question", "Measurement", "Decision" — repeated once per entry in
 * `DECISIONS.md`, and a result list of 311 rows called "Question" locates nothing.
 */
export function buildSearchIndex(entries: readonly DocEntry[] = readDocs()): SearchIndex {
  const docs: SearchDoc[] = []
  const sections: SearchSection[] = []

  for (const entry of entries) {
    const at = docs.length

    docs.push({
      file: entry.fileName,
      href: entry.href,
      title: entry.title,
      summary: plainText(entry.frontmatter?.summary ?? ''),
      snippet: truncate(plainText(entry.firstParagraph), SNIPPET_LIMIT),
    })

    for (const heading of entry.headings) {
      if (heading.depth === 2) {
        const text = plainText(heading.text)

        sections.push(
          heading.slug === slugify(text)
            ? { doc: at, text }
            : { doc: at, text, slug: heading.slug },
        )
      }
    }
  }

  return { docs, sections }
}

export const serializeSearchIndex = (index: SearchIndex): string => JSON.stringify(index)
