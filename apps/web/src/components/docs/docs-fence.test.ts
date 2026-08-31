import { describe, expect, it } from 'vitest'

import { readDocs } from '../../lib/docs/read-docs'

import { parseFence } from './docs-fence'

describe('parseFence', () => {
  it.each([
    ['ts', { language: 'ts', label: 'TypeScript' }],
    ['tsx', { language: 'tsx', label: 'TSX' }],
    ['yaml', { language: 'bash', label: 'YAML' }],
    ['jsonc', { language: 'json', label: 'JSON' }],
    ['svg', { language: 'html', label: 'SVG' }],
    ['dockerfile', { language: 'bash', label: 'Dockerfile' }],
    ['markdown', { language: 'plain', label: 'Markdown' }],
    ['', { language: 'plain', label: 'Text' }],
    [undefined, { language: 'plain', label: 'Text' }],
  ])('maps %s through the alias map ADR-308 measured', (info, expected) => {
    const fence = parseFence(info)

    expect({ language: fence.language, label: fence.label }).toEqual(expected)
  })

  it('reads the highlighted lines the fence asks for', () => {
    expect(parseFence('ts {2-4,7}').highlight).toEqual([2, 3, 4, 7])
    expect(parseFence('ts').highlight).toEqual([])
  })

  it('reads an optional filename and keeps the language beside it', () => {
    const fence = parseFence('ts title="next.config.ts" {1}')

    expect(fence.filename).toBe('next.config.ts')
    expect(fence.language).toBe('ts')
    expect(fence.highlight).toEqual([1])
  })

  it('falls back to plain text for a language nobody has taught it', () => {
    const fence = parseFence('brainfuck')

    expect(fence.language).toBe('plain')
    expect(fence.label).toBe('brainfuck')
  })

  it('covers every fence language the corpus actually uses', () => {
    const unknown = new Set<string>()

    for (const entry of readDocs()) {
      for (const token of entry.tokens) {
        if (token.type !== 'code') {
          continue
        }

        const info = (token.lang ?? '').trim().split(/\s+/)[0] ?? ''
        const fence = parseFence(info)

        if (info !== '' && fence.language === 'plain' && fence.label === info) {
          unknown.add(info)
        }
      }
    }

    expect([...unknown]).toEqual([])
  })
})
