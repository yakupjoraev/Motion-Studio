import { describe, expect, it } from 'vitest'

import { FORMAT_CONFIG, formatFiles, loadPrettier, parserFor } from './format'

/**
 * EXPORT_ENGINE.md § Formatting. Two claims are worth a test and one of them is the reason this file
 * exists at all: "If Prettier fails to load (offline), unformatted output ships with a warning. Working
 * unformatted code beats a failed export."
 */
describe('parserFor', () => {
  it('routes every extension a printer emits', () => {
    expect(parserFor('components/hero.tsx')).toBe('typescript')
    expect(parserFor('components/hero.jsx')).toBe('typescript')
    expect(parserFor('lib/motion.ts')).toBe('typescript')
    expect(parserFor('index.js')).toBe('typescript')
    expect(parserFor('app/globals.css')).toBe('css')
  })

  /** JSON and Markdown are already canonical when they leave their printers — see `print-json.ts`. */
  it('leaves JSON and Markdown alone', () => {
    expect(parserFor('package.json')).toBeUndefined()
    expect(parserFor('README.md')).toBeUndefined()
  })
})

describe('the output config', () => {
  it('is our own style, so a paste into a codebase like ours needs no reformat', () => {
    expect(FORMAT_CONFIG).toMatchObject({
      tabWidth: 2,
      semi: false,
      singleQuote: true,
      jsxSingleQuote: false,
      printWidth: 100,
      trailingComma: 'all',
    })
  })
})

describe('formatFiles', () => {
  it('formats TypeScript and CSS with the real Prettier', async () => {
    const outcome = await formatFiles([
      { path: 'a.tsx', contents: 'export const a = {x:1};\n' },
      { path: 'b.css', contents: '.a{color:red}\n' },
    ])

    expect(outcome.files[0]?.contents).toBe('export const a = { x: 1 }\n')
    expect(outcome.files[1]?.contents).toBe('.a {\n  color: red;\n}\n')
    expect(outcome.warnings).toEqual([])
  })

  it('passes through a file it has no parser for, byte for byte', async () => {
    const manifest = '{\n  "name": "x"\n}\n'
    const outcome = await formatFiles([{ path: 'package.json', contents: manifest }])

    expect(outcome.files[0]?.contents).toBe(manifest)
  })

  /** The offline path: the export still ships, and the warning says why it looks the way it does. */
  it('ships unformatted with a warning when Prettier cannot be loaded', async () => {
    const source = 'export const a = {x:1};\n'
    const outcome = await formatFiles([{ path: 'a.tsx', contents: source }], async () => undefined)

    expect(outcome.files[0]?.contents).toBe(source)
    expect(outcome.warnings).toHaveLength(1)
    expect(outcome.warnings[0]?.message).toContain('unformatted')
  })

  it('reports the one file it could not parse and keeps the rest', async () => {
    const outcome = await formatFiles([
      { path: 'broken.tsx', contents: 'export function (' },
      { path: 'fine.ts', contents: 'export const a = 1\n' },
    ])

    expect(outcome.warnings).toHaveLength(1)
    expect(outcome.warnings[0]?.message).toContain('broken.tsx')
    expect(outcome.files[0]?.contents).toBe('export function (')
    expect(outcome.files[1]?.contents).toBe('export const a = 1\n')
  })

  it('loads the real formatter in this environment', async () => {
    expect(await loadPrettier()).toBeTypeOf('function')
  })
})
