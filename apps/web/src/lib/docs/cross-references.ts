import { INDEX_FILE, fileNameToSlug, readDocs } from './read-docs'

export type LinkTarget =
  | { readonly kind: 'doc'; readonly href: string }
  | { readonly kind: 'external'; readonly href: string }
  | { readonly kind: 'plain' }

let names: ReadonlySet<string> | null = null

/** Built once: every link in the corpus asks this question, and the answer cannot change per render. */
const knownFiles = (): ReadonlySet<string> => {
  names ??= new Set(readDocs().map((entry) => entry.fileName))

  return names
}

/**
 * `EXPORT_ENGINE.md#printers` → `/docs/export-engine#printers`, `README.md` → `/docs`. A relative
 * target that is not one of the documents renders as text rather than as a link that 404s — the
 * corpus has none today, and `links.test.ts` is what keeps that true.
 */
export function resolveLink(target: string, files: ReadonlySet<string> = knownFiles()): LinkTarget {
  if (/^https?:\/\//.test(target)) {
    return { kind: 'external', href: target }
  }

  if (target.startsWith('#')) {
    return { kind: 'doc', href: target }
  }

  const [path = '', anchor] = target.split('#')
  const fileName = path.split('/').pop() ?? ''

  if (!files.has(fileName) || path.includes('..')) {
    return { kind: 'plain' }
  }

  const base = fileName === INDEX_FILE ? '/docs' : `/docs/${fileNameToSlug(fileName)}`

  return { kind: 'doc', href: anchor === undefined ? base : `${base}#${anchor}` }
}

export interface MarkdownLink {
  readonly text: string
  readonly target: string
}

const LINK_PATTERN = /\[([^\]]+)\]\(([^)\s]+)\)/g

export function markdownLinks(body: string): readonly MarkdownLink[] {
  return [...body.matchAll(LINK_PATTERN)].map((match) => ({
    text: match[1] ?? '',
    target: match[2] ?? '',
  }))
}

export interface SectionReference {
  /** The path as written, so `prompts/00-GLOBAL_RULES.md` keeps its directory. */
  readonly target: string
  readonly fileName: string
  /** The text after `§`, cut at the first delimiter — see ADR-311 on why this is a prefix match. */
  readonly section: string
}

const REFERENCE_PATTERN = /(?:([\w./-]*\/))?((?:\d+-)?[A-Z][A-Z_0-9]*\.md)`?\)?\s*§\s*([^\n]*)/g

export function sectionReferences(body: string): readonly SectionReference[] {
  return [...body.matchAll(REFERENCE_PATTERN)].map((match) => {
    const directory = match[1] ?? ''
    const fileName = match[2] ?? ''
    const tail = (match[3] ?? '').split(/[.,;:|)]|\s+—\s+/)[0] ?? ''

    return { target: `${directory}${fileName}`, fileName, section: tail.trim() }
  })
}

export const normalizeHeading = (text: string): string =>
  text.toLowerCase().replace(/[`*_]/g, '').replace(/\s+/g, ' ').trim()

/** A numbered heading is cited three ways: in full, by its number, or by its name. */
export function headingAliases(text: string): readonly string[] {
  const full = normalizeHeading(text)
  const numbered = /^(\d+)\.\s+(.*)$/.exec(full)

  return numbered === null ? [full] : [full, numbered[1] ?? '', numbered[2] ?? '']
}
