import { describe, expect, it } from 'vitest'

import { collectImports } from './collect-imports'

describe('collectImports', () => {
  it('merges two specs for the same module into one', () => {
    expect(
      collectImports([
        { from: 'motion/react', named: ['motion'] },
        { from: 'motion/react', named: ['useReducedMotion'] },
      ]),
    ).toEqual([{ from: 'motion/react', named: ['motion', 'useReducedMotion'] }])
  })

  it('dedupes a name imported twice', () => {
    expect(
      collectImports([
        { from: 'motion/react', named: ['motion'] },
        { from: 'motion/react', named: ['motion'] },
      ]),
    ).toEqual([{ from: 'motion/react', named: ['motion'] }])
  })

  it('sorts builtin, external, alias, relative — and alphabetically inside each', () => {
    const sorted = collectImports([
      { from: './hero-section' },
      { from: '@/lib/motion', named: ['fadeUp'] },
      { from: 'node:path', named: ['join'] },
      { from: 'motion/react', named: ['motion'] },
      { from: 'clsx', default: 'clsx' },
    ])

    expect(sorted.map((spec) => spec.from)).toEqual([
      'node:path',
      'clsx',
      'motion/react',
      '@/lib/motion',
      './hero-section',
    ])
  })

  it('keeps a type-only spec apart from a value spec for the same module', () => {
    const sorted = collectImports([
      { from: 'motion/react', named: ['MotionProps'], typeOnly: true },
      { from: 'motion/react', named: ['motion'] },
    ])

    expect(sorted).toEqual([
      { from: 'motion/react', named: ['motion'] },
      { from: 'motion/react', named: ['MotionProps'], typeOnly: true },
    ])
  })

  it('keeps the default binding', () => {
    expect(collectImports([{ from: 'next/image', default: 'Image' }])).toEqual([
      { from: 'next/image', default: 'Image' },
    ])
  })

  it('omits the named key entirely when a spec has no named bindings', () => {
    const [only] = collectImports([{ from: './globals.css' }])

    expect(only !== undefined && 'named' in only).toBe(false)
  })

  it('answers with nothing for nothing, which is what makes an unused import impossible', () => {
    expect(collectImports([])).toEqual([])
  })
})
