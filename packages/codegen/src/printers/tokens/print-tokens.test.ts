import { describe, expect, it } from 'vitest'

import { FIXTURE_TOKEN_FORMATS, fixtureTheme } from '../../test/theme'

import { printTokens } from './print-tokens'

/**
 * ADR-236: the four formats are printed in `packages/theme/src/export/` and arrive here already
 * printed, so what this target decides is which files exist and in what order — and that is what these
 * assertions check. The parity assertion prompt 44 asks for ("the accent is byte-identical across all
 * four outputs") is made where it can be real, in `packages/theme/src/export/export.test.ts`; repeating
 * it here against an injected fixture would assert the fixture.
 */
describe('printTokens', () => {
  it('writes one file per format, in the order the theme package listed them', () => {
    const result = printTokens({ theme: fixtureTheme() })

    expect(result.files.map((file) => file.path)).toEqual([
      'theme.css',
      'tailwind.config.ts',
      'theme.json',
      'figma-tokens.json',
    ])
  })

  it('passes the bytes through untouched, because it is not a generator', () => {
    const result = printTokens({ theme: fixtureTheme() })

    for (const [index, format] of (FIXTURE_TOKEN_FORMATS ?? []).entries()) {
      expect(result.files[index]?.contents).toBe(format.contents)
    }
  })

  it('installs nothing', () => {
    expect(printTokens({ theme: fixtureTheme() }).dependencies).toEqual({})
  })

  it('writes nothing and says so when it was handed no formats', () => {
    const result = printTokens({ theme: { css: '', colorModeScript: '' } })

    expect(result.files).toEqual([])
    expect(result.warnings[0]?.message).toContain('nothing to write')
  })

  it('writes nothing and says so when it was handed no theme at all', () => {
    expect(printTokens({}).files).toEqual([])
    expect(printTokens({}).warnings).toHaveLength(1)
  })

  /** Two formats claiming one name would silently drop one of them; the export says which. */
  it('reports a collision rather than overwriting the earlier file', () => {
    const duplicate = { id: 'other', filename: 'theme.css', contents: '/* other */\n' }
    const result = printTokens({
      theme: { ...fixtureTheme(), tokens: [...(FIXTURE_TOKEN_FORMATS ?? []), duplicate] },
    })

    expect(result.files).toHaveLength(4)
    expect(result.warnings[0]?.message).toContain("'theme.css'")
  })
})
