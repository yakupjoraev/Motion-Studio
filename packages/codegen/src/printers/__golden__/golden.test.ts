import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { documentSchema, serializeDocument } from '@motion-studio/schema'
import { describe, expect, it } from 'vitest'

import { DEFAULT_EXPORT_OPTIONS, EXPORT_TARGETS, type ExportOptions } from '../../options.types'
import { GOLDEN_DOCUMENTS } from '../../test/documents'
import { GOLDEN_CASES } from '../../test/golden-cases'
import { printCase } from '../../test/print-case'

/**
 * The backbone — EXPORT_ENGINE.md § Testing: "Each `(document × target × option-set)` pair has an
 * expected output asserted exactly. Updating a golden file requires reading the diff."
 *
 * The documents are read off disk rather than built here, so a stale `.motion.json` fails instead of
 * being quietly ignored, and the export under test is one that survived serialisation — ADR-235.
 */
const ROOT = fileURLToPath(new URL('.', import.meta.url))

const read = (path: string): string => readFileSync(join(ROOT, path), 'utf8')

function tree(directory: string, prefix = ''): readonly string[] {
  return readdirSync(join(ROOT, directory), { withFileTypes: true })
    .flatMap((entry) =>
      entry.isDirectory()
        ? tree(join(directory, entry.name), `${prefix}${entry.name}/`)
        : [`${prefix}${entry.name}`],
    )
    .sort()
}

const documentFor = (name: string) =>
  documentSchema.parse(JSON.parse(read(join('documents', `${name}.motion.json`))))

describe('the golden documents', () => {
  it.each(Object.keys(GOLDEN_DOCUMENTS))('%s is on disk and parses', (name) => {
    expect(documentFor(name).rootId).toBe(GOLDEN_DOCUMENTS[name]?.().rootId)
  })

  it.each(Object.keys(GOLDEN_DOCUMENTS))('%s has not drifted from its builder', (name) => {
    const make = GOLDEN_DOCUMENTS[name]

    expect(read(join('documents', `${name}.motion.json`))).toBe(
      `${serializeDocument(make?.() ?? documentFor(name))}\n`,
    )
  })
})

describe('the golden cases', () => {
  it('name a document that exists', () => {
    const missing = GOLDEN_CASES.filter((entry) => GOLDEN_DOCUMENTS[entry.document] === undefined)

    expect(missing).toEqual([])
  })

  it('are unique', () => {
    expect(new Set(GOLDEN_CASES.map((entry) => entry.id)).size).toBe(GOLDEN_CASES.length)
  })

  /**
   * The list's own rule, checked rather than promised. `format` and `assets` are exempt for the reasons
   * `golden-cases.ts` states beside them; the two printed targets are the ones this prompt builds.
   */
  it('cover every option field at a non-default value', () => {
    const exempt = new Set(['format', 'assets'])
    const covered = new Set<string>()

    for (const entry of GOLDEN_CASES) {
      for (const [name, value] of Object.entries(entry.options)) {
        if (value !== DEFAULT_EXPORT_OPTIONS[name as keyof ExportOptions]) {
          covered.add(name)
        }
      }
    }

    const uncovered = Object.keys(DEFAULT_EXPORT_OPTIONS).filter(
      (name) => !exempt.has(name) && !covered.has(name),
    )

    expect(uncovered).toEqual([])
  })

  it('cover every export target', () => {
    const used = new Set(GOLDEN_CASES.map((entry) => entry.options.target ?? 'react'))

    expect(EXPORT_TARGETS.filter((target) => !used.has(target))).toEqual([])
  })

  it('cover every document', () => {
    const used = new Set(GOLDEN_CASES.map((entry) => entry.document))

    expect([...Object.keys(GOLDEN_DOCUMENTS)].filter((name) => !used.has(name))).toEqual([])
  })
})

describe.each(GOLDEN_CASES)('$id', (goldenCase) => {
  it('prints the expected file list', async () => {
    const result = await printCase(goldenCase, documentFor(goldenCase.document))

    expect(result.files.map((file) => file.path).sort()).toEqual(
      tree(join('expected', goldenCase.id)),
    )
  })

  it('prints the expected bytes', async () => {
    const result = await printCase(goldenCase, documentFor(goldenCase.document))

    for (const file of result.files) {
      expect(file.contents, `${goldenCase.id}/${file.path}`).toBe(
        read(join('expected', goldenCase.id, file.path)),
      )
    }
  })

  it('reports the expected warnings and dependencies', async () => {
    const result = await printCase(goldenCase, documentFor(goldenCase.document))
    const report = {
      dependencies: result.dependencies,
      warnings: result.warnings.map((entry) => ({
        code: entry.code,
        message: entry.message,
        ...(entry.nodeId === undefined ? {} : { nodeId: entry.nodeId }),
      })),
    }

    expect(`${JSON.stringify(report, null, 2)}\n`).toBe(
      read(join('expected', `${goldenCase.id}.report.json`)),
    )
  })
})
