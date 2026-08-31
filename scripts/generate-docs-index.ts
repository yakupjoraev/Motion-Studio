#!/usr/bin/env tsx
/**
 * `docs/README.md`'s index tables, generated from the documents' frontmatter.
 *
 * Prompt 53 decided the nav source is frontmatter, and this keeps the index from becoming a second
 * one: `pnpm generate:docs-index` writes the tables, `--check` fails CI when the committed file
 * differs. Neither the index nor the nav is hand-maintained.
 *
 * The frontmatter reader here is deliberately its own: a root script may not reach into an app's
 * source (ARCHITECTURE.md § Dependency graph). The two readers cannot drift silently — the app's
 * `build-nav.test.ts` asserts its nav against the tables this script wrote.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DOCS = join(ROOT, 'docs')
const INDEX = join(DOCS, 'README.md')

const GROUP_ORDER = [
  'Product',
  'Engineering foundations',
  'Design',
  'Subsystems',
  'Quality',
] as const

interface Entry {
  readonly fileName: string
  readonly group: string
  readonly order: number
  readonly summary: string
}

const unquote = (value: string): string =>
  (value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))
    ? value.slice(1, -1)
    : value

function frontmatterOf(fileName: string): Entry {
  // An editor that saves UTF-8 with a BOM would otherwise hide the frontmatter behind one invisible
  // character, and the document would drop out of both the index and the nav in silence.
  const raw = readFileSync(join(DOCS, fileName), 'utf8')
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')

  if (!raw.startsWith('---\n')) {
    throw new Error(`${fileName}: no frontmatter block — the nav and the index are built from it`)
  }

  const end = raw.indexOf('\n---', 4)

  if (end === -1) {
    throw new Error(`${fileName}: the frontmatter block is not closed`)
  }

  const fields = new Map<string, string>()

  for (const line of raw.slice(4, end).split('\n')) {
    const separator = line.indexOf(':')

    if (separator > 0) {
      fields.set(line.slice(0, separator).trim(), unquote(line.slice(separator + 1).trim()))
    }
  }

  const group = fields.get('group')
  const order = Number(fields.get('order'))
  const summary = fields.get('summary')

  if (group === undefined || summary === undefined || !Number.isInteger(order)) {
    throw new Error(`${fileName}: frontmatter needs group, order and summary`)
  }

  if (!GROUP_ORDER.includes(group as (typeof GROUP_ORDER)[number])) {
    throw new Error(`${fileName}: "${group}" is not one of the five index groups`)
  }

  return { fileName, group, order, summary }
}

function renderIndex(entries: readonly Entry[]): string {
  const sections: string[] = []

  for (const group of GROUP_ORDER) {
    const rows = entries
      .filter((entry) => entry.group === group)
      .sort((a, b) => a.order - b.order)
      .map((entry) => `| [${entry.fileName}](${entry.fileName}) | ${entry.summary} |`)

    if (rows.length === 0) {
      throw new Error(`the "${group}" group has no documents`)
    }

    sections.push(`### ${group}\n| Document | Owns |\n| --- | --- |\n${rows.join('\n')}`)
  }

  return `## Index\n\n${sections.join('\n\n')}\n\n`
}

function rewrite(current: string, generated: string): string {
  const start = current.indexOf('## Index\n')

  if (start === -1) {
    throw new Error('docs/README.md has no "## Index" heading')
  }

  const after = current.indexOf('\n## ', start + 1)

  if (after === -1) {
    throw new Error('docs/README.md has no heading after "## Index"')
  }

  return current.slice(0, start) + generated + current.slice(after + 1)
}

const entries = readdirSync(DOCS)
  .filter((name) => name.endsWith('.md') && name !== 'README.md')
  .sort()
  .map(frontmatterOf)

const current = readFileSync(INDEX, 'utf8').replace(/\r\n/g, '\n')
const next = rewrite(current, renderIndex(entries))

if (process.argv.includes('--check')) {
  if (next !== current) {
    process.stderr.write(
      "docs/README.md is out of step with the documents' frontmatter.\nRun `pnpm generate:docs-index` and commit the result.\n",
    )
    process.exit(1)
  }

  process.stdout.write(`docs/README.md matches ${entries.length} documents\n`)
} else {
  writeFileSync(INDEX, next, 'utf8')
  process.stdout.write(`docs/README.md index written from ${entries.length} documents\n`)
}
