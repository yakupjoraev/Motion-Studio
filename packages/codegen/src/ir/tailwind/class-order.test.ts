import { describe, expect, it } from 'vitest'

import { familyRank, sortClasses, splitVariant } from './class-order'
import { mergeAndSort } from './merge-classes'

const sorted = (input: readonly string[]): string => sortClasses(input).join(' ')

describe('sortClasses', () => {
  it('produces the order the aurora layer is written in in EXPORT_ENGINE.md', () => {
    const input = ['blur-3xl', 'absolute', 'opacity-60', 'pointer-events-none', 'inset-0', '-z-10']

    expect(sorted(input)).toBe('pointer-events-none absolute inset-0 -z-10 opacity-60 blur-3xl')
  })

  it('produces the order the hero band is written in in EXPORT_ENGINE.md', () => {
    const input = ['md:py-32', 'overflow-hidden', 'px-6', 'py-24', 'isolate', 'relative']

    expect(sorted(input)).toBe('relative isolate overflow-hidden px-6 py-24 md:py-32')
  })

  it('produces the exact string RESPONSIVE_ENGINE.md § Codegen prints', () => {
    const input = ['lg:gap-6', 'grid', 'md:grid-cols-2', 'gap-4', 'lg:grid-cols-3', 'grid-cols-1']

    expect(sorted(input)).toBe('grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6')
  })

  it('is variant-major: every unprefixed class precedes every prefixed one — ADR-224', () => {
    expect(sorted(['md:relative', 'text-lg'])).toBe('text-lg md:relative')
  })

  it('orders the breakpoints by the cascade rather than alphabetically', () => {
    const input = ['2xl:p-2', 'sm:p-2', 'xl:p-2', 'lg:p-2', 'md:p-2']

    expect(sorted(input)).toBe('sm:p-2 md:p-2 lg:p-2 xl:p-2 2xl:p-2')
  })

  it('puts a variant the cascade does not name after every breakpoint', () => {
    expect(sorted(['hover:p-2', 'lg:p-2', 'p-2'])).toBe('p-2 lg:p-2 hover:p-2')
  })

  it('keeps the class plan order for two utilities of one family', () => {
    expect(sorted(['pt-2', 'pb-4'])).toBe('pt-2 pb-4')
  })

  it('sorts a family it does not know after every family it does', () => {
    expect(sorted(['v-section-tint', 'text-lg'])).toBe('text-lg v-section-tint')
  })

  it('reads an arbitrary value as the family its prefix names', () => {
    expect(familyRank('grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]')).toBe(
      familyRank('grid-cols-3'),
    )
  })

  it('separates utilities that share a prefix by their exact match', () => {
    expect(familyRank('bg-cover')).not.toBe(familyRank('bg-surface-1'))
    expect(familyRank('flex')).not.toBe(familyRank('flex-col'))
    expect(familyRank('flex-1')).not.toBe(familyRank('flex-col'))
  })
})

describe('splitVariant', () => {
  it('splits on the last colon, so a stacked variant stays whole', () => {
    expect(splitVariant('dark:md:p-2')).toEqual({ variant: 'dark:md', utility: 'p-2' })
  })

  it('reports no variant for an unprefixed class', () => {
    expect(splitVariant('p-2')).toEqual({ variant: '', utility: 'p-2' })
  })
})

describe('mergeAndSort', () => {
  it('resolves a conflict at build time, so the output needs no runtime cn()', () => {
    expect(mergeAndSort(['p-4', 'p-6'])).toEqual(['p-6'])
  })

  it('keeps two classes that conflict only inside different variants', () => {
    expect(mergeAndSort(['hidden', 'md:block'])).toEqual(['hidden', 'md:block'])
  })

  it('keeps a preset class that only looks like a margin utility', () => {
    expect(mergeAndSort(['ms-4', 'ms-shine'])).toEqual(['ms-4', 'ms-shine'])
  })

  it('answers with nothing for nothing', () => {
    expect(mergeAndSort([])).toEqual([])
  })
})
