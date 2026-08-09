// @vitest-environment node
import { readFileSync } from 'node:fs'
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

const IMPORT_RE = /(?:^|\n)\s*(?:import|export)[\s\S]*?from\s*['"]([^'"]+)['"]/g

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
})
