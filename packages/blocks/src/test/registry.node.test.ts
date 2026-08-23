// @vitest-environment node
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { blockId } from '@motion-studio/schema'
import { describe, expect, it } from 'vitest'

import { blockRegistry } from '../registry'

/**
 * ADR-107, proven rather than asserted. The runtime half — `blockRegistry` answering in a `node`
 * environment — is necessary but not sufficient: React imports perfectly well under Node, so a test
 * that only imported the module would pass with the split broken.
 *
 * So the graph is walked instead. Every relative import from `registry.ts` is followed, and the
 * bare ones are checked against what this half of the package is allowed to reach.
 */
const HERE = dirname(fileURLToPath(import.meta.url))

const ALLOWED_PACKAGES = new Set(['@motion-studio/schema', '@motion-studio/utils', 'zod'])

/**
 * The markup half — ADR-249. Its producers call the blocks' own `cva`, so it reaches one package the
 * metadata half does not, and that is the whole difference: it must still be React-free, because the
 * export runs it under `node`.
 */
const ALLOWED_FOR_MARKUP = new Set([
  ...ALLOWED_PACKAGES,
  'class-variance-authority',
  // Data, both of them: the radius ladder a nested corner is computed from, and the glyph table an
  // exported `<svg>` is drawn from (ADR-250). Neither pulls React, which is the only thing at stake.
  '@motion-studio/tokens',
  '@motion-studio/icons/geometry',
])

/**
 * The clause between `import`/`export` and `from` is a name list — it never contains a quote. Saying so
 * is what stops the scan walking *through* a string literal to reach a later `from`, which is how
 * `code-block`'s default sample — a snippet of TypeScript containing `from '@/components/…'` — used to
 * read as an import of a package this half of the package is not allowed to reach.
 *
 * A test that constrained what a block's example text may say would be testing the wrong thing.
 */
const IMPORT_RE = /(?:^|\n)\s*(?:import|export)(?:[^'"`;]|\n)*?from\s*['"]([^'"]+)['"]/g

/**
 * `import type` is erased, so the module it names is never loaded and cannot break the split. What
 * this test is about is the **runtime** graph, so a type-only statement is skipped rather than
 * followed — otherwise a producer importing its block's props type reads as importing React, which is
 * exactly what `import type` exists to prevent.
 */
const TYPE_ONLY = /^\s*(?:import|export)\s+type\s/

const resolveModule = (from: string, specifier: string): string | null => {
  const base = resolve(dirname(from), specifier)

  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`]) {
    try {
      readFileSync(candidate, 'utf8')

      return candidate
    } catch {
      // Not this one.
    }
  }

  return null
}

function walk(entry: string): { files: string[]; packages: string[] } {
  const seen = new Set<string>()
  const packages = new Set<string>()
  const queue = [entry]

  while (queue.length > 0) {
    const file = queue.pop()

    if (file === undefined || seen.has(file)) {
      continue
    }

    seen.add(file)

    const source = readFileSync(file, 'utf8')

    for (const match of source.matchAll(IMPORT_RE)) {
      if (TYPE_ONLY.test(match[0])) {
        continue
      }

      const specifier = match[1] ?? ''

      if (!specifier.startsWith('.')) {
        packages.add(specifier)

        continue
      }

      const resolved = resolveModule(file, specifier)

      if (resolved !== null) {
        queue.push(resolved)
      }
    }
  }

  return { files: [...seen], packages: [...packages] }
}

describe('blockRegistry under node', () => {
  it('answers without a DOM', () => {
    expect(blockRegistry.require(blockId('section')).name).toBe('Section')
    expect(typeof globalThis.document).toBe('undefined')
  })

  it('pulls no component into its module graph', () => {
    const graph = walk(resolve(HERE, '..', 'registry.ts'))

    expect(graph.files.filter((file) => file.endsWith('.tsx'))).toEqual([])
    expect(graph.packages.filter((name) => name.startsWith('react'))).toEqual([])
  })

  it('reaches only the packages this half is allowed to', () => {
    const graph = walk(resolve(HERE, '..', 'registry.ts'))

    for (const name of graph.packages) {
      expect(ALLOWED_PACKAGES, name).toContain(name)
    }
  })

  it('keeps the markup producers out of its own graph', () => {
    const graph = walk(resolve(HERE, '..', 'registry.ts'))

    expect(graph.packages).not.toContain('class-variance-authority')
  })
})

/**
 * Every producer on disk, not only the ones a block already names. A shared producer written for the
 * next prompt is React-free or it is not, and finding that out when it is wired is finding out late.
 */
const producerFiles = (directory: string): readonly string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name)

    if (entry.isDirectory()) {
      return producerFiles(path)
    }

    return entry.name.endsWith('.markup.ts') ? [path] : []
  })

describe('the markup producers under node', () => {
  const files = producerFiles(resolve(HERE, '..'))

  it('finds the producers', () => {
    expect(files.length).toBeGreaterThan(0)
  })

  it.each(files.map((file) => [file.slice(file.indexOf('src')), file] as const))(
    '%s pulls no component and only the packages a producer may reach',
    (_name, file) => {
      const graph = walk(file)

      expect(graph.files.filter((entry) => entry.endsWith('.tsx'))).toEqual([])
      expect(graph.packages.filter((name) => name.startsWith('react'))).toEqual([])

      for (const name of graph.packages) {
        expect(ALLOWED_FOR_MARKUP, name).toContain(name)
      }
    },
  )
})

describe('markupRegistry under node', () => {
  it('pulls no component into its module graph', () => {
    const graph = walk(resolve(HERE, '..', 'markup-registry.ts'))

    expect(graph.files.filter((file) => file.endsWith('.tsx'))).toEqual([])
    expect(graph.packages.filter((name) => name.startsWith('react'))).toEqual([])
  })

  it('reaches only the packages a producer is allowed to', () => {
    const graph = walk(resolve(HERE, '..', 'markup-registry.ts'))

    for (const name of graph.packages) {
      expect(ALLOWED_FOR_MARKUP, name).toContain(name)
    }
  })
})
