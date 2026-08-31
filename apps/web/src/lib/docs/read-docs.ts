import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'

import { Lexer, type Token } from 'marked'

import { type DocFrontmatter, splitFrontmatter } from './frontmatter'
import { type DocHeading, createSlugger } from './headings'

export interface DocEntry {
  /** `''` for the index, which is `README.md` and lives at `/docs`. */
  readonly slug: string
  readonly fileName: string
  readonly href: string
  readonly title: string
  readonly frontmatter: DocFrontmatter | null
  readonly headings: readonly DocHeading[]
  readonly firstParagraph: string
  readonly body: string
  readonly tokens: readonly Token[]
}

/** `DRAG_AND_DROP.md` → `drag-and-drop`. */
export const fileNameToSlug = (fileName: string): string =>
  fileName.replace(/\.md$/, '').toLowerCase().replace(/_/g, '-')

export const INDEX_FILE = 'README.md'

/**
 * `process.cwd()` is `apps/web` under `next build`, `vitest` and `tsx` alike, but a runner that
 * changes it would otherwise fail with a missing-file error three layers down.
 */
function findDocsDir(): string {
  let current = process.cwd()

  for (let depth = 0; depth < 6; depth += 1) {
    const candidate = join(current, 'docs')

    if (
      existsSync(join(candidate, INDEX_FILE)) &&
      existsSync(join(current, 'pnpm-workspace.yaml'))
    ) {
      return candidate
    }

    current = resolve(current, '..')
  }

  throw new Error('docs/ was not found above the working directory')
}

const firstParagraphOf = (tokens: readonly Token[]): string => {
  for (const token of tokens) {
    if (token.type === 'paragraph') {
      return token.text.replace(/\s+/g, ' ').trim()
    }
  }

  return ''
}

function readEntry(dir: string, fileName: string): DocEntry {
  // An editor that saves UTF-8 with a BOM would otherwise hide the frontmatter behind one invisible
  // character, and the block would render as page content instead of feeding the nav.
  const raw = readFileSync(join(dir, fileName), 'utf8')
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
  const { frontmatter, body } = splitFrontmatter(raw, fileName)
  const tokens = new Lexer({ gfm: true }).lex(body)
  const slugFor = createSlugger()
  const headings: DocHeading[] = []

  for (const token of tokens) {
    if (token.type === 'heading') {
      const text = token.text.trim()

      headings.push({ depth: token.depth, text, slug: slugFor(text) })
    }
  }

  const slug = fileName === INDEX_FILE ? '' : fileNameToSlug(fileName)

  return {
    slug,
    fileName,
    href: slug === '' ? '/docs' : `/docs/${slug}`,
    title: headings.find((heading) => heading.depth === 1)?.text ?? fileName,
    frontmatter,
    headings,
    firstParagraph: firstParagraphOf(tokens),
    body,
    tokens,
  }
}

let cache: readonly DocEntry[] | null = null

export function docsDir(): string {
  return findDocsDir()
}

/**
 * Read once per process. `generateStaticParams` and 29 page renders happen in the same build, and
 * lexing 21 000 lines of markdown per page is the difference between a build and a wait.
 */
export function readDocs(): readonly DocEntry[] {
  if (cache !== null) {
    return cache
  }

  const dir = findDocsDir()
  const files = readdirSync(dir)
    .filter((name) => name.endsWith('.md'))
    .sort()

  cache = files.map((fileName) => readEntry(dir, fileName))

  return cache
}

export const findDoc = (slug: string): DocEntry | undefined =>
  readDocs().find((entry) => entry.slug === slug)
