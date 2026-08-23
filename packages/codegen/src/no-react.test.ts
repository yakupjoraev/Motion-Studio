import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { buildIR } from './ir/build-ir'
import { fixtureRegistry } from './test/blocks'
import { fullLanding } from './test/documents'
import { fixtureMarkup } from './test/markup'
import { fixturePresets } from './test/presets'

/**
 * The claim EXPORT_ENGINE.md and ARCHITECTURE.md § Dependency graph make about this package: the export
 * engine has no React in it and does not know that a block renders. `check-deps` enforces it at the
 * manifest level; this enforces it per file, and then runs `buildIR` in an environment with no DOM.
 */
const SOURCE = fileURLToPath(new URL('.', import.meta.url))

function sources(directory: string): readonly string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)

    if (entry.isDirectory()) {
      return sources(path)
    }

    return entry.name.endsWith('.ts') ? [path] : []
  })
}

const IMPORT_RE = /(?:^|\n)(import\s[\s\S]*?from\s+'([^']+)')/g

/**
 * Assembled rather than written out: `check-deps` reads specifiers out of source text, and a test that
 * spelled the forbidden package would be reported as importing it.
 */
const SCOPE = '@motion-studio/'
const BLOCKS = `${SCOPE}blocks`

const files = sources(SOURCE).map((path) => ({ path, text: readFileSync(path, 'utf8') }))

const specifiers = (): readonly {
  readonly path: string
  readonly statement: string
  readonly from: string
}[] =>
  files.flatMap((file) =>
    [...file.text.matchAll(IMPORT_RE)].map((match) => ({
      path: file.path,
      statement: match[1] ?? '',
      from: match[2] ?? '',
    })),
  )

describe('the export engine', () => {
  it('reads its own sources, so a passing assertion means something', () => {
    expect(files.length).toBeGreaterThan(10)
    expect(specifiers().length).toBeGreaterThan(20)
  })

  it('imports React nowhere', () => {
    const offenders = specifiers().filter((entry) =>
      ['react', 'react-dom', 'motion/react'].includes(entry.from),
    )

    expect(offenders).toEqual([])
  })

  it('imports the block catalogue nowhere', () => {
    expect(specifiers().filter((entry) => entry.from === BLOCKS)).toEqual([])
  })

  it('takes only types from the motion package, so its runtime graph stays React-free', () => {
    const valueImports = specifiers().filter(
      (entry) =>
        entry.from === '@motion-studio/motion' && !entry.statement.startsWith('import type'),
    )

    expect(valueImports).toEqual([])
  })
})

describe('buildIR under node', () => {
  it('runs with no DOM in the environment at all', () => {
    expect(typeof globalThis.document).toBe('undefined')
    expect(typeof globalThis.window).toBe('undefined')

    const ir = buildIR({
      document: fullLanding(),
      registry: fixtureRegistry(),
      markup: fixtureMarkup,
      presets: fixturePresets(),
    })

    expect(ir.components.length).toBeGreaterThan(1)
  })
})
