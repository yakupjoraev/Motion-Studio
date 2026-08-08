import { describe, expect, it } from 'vitest'

import { createVersionedSelector } from './create-versioned-selector'

interface Subject {
  version: number
  breakpoint: string
  items: readonly string[]
}

const subject = (overrides: Partial<Subject> = {}): Subject => ({
  version: 0,
  breakpoint: 'base',
  items: ['a', 'b'],
  ...overrides,
})

describe('createVersionedSelector', () => {
  it('returns the identical reference while the key holds', () => {
    let computed = 0
    const select = createVersionedSelector<Subject, readonly string[]>(
      (state) => [state.version],
      (state) => {
        computed += 1

        return [...state.items]
      },
    )

    const state = subject()
    const first = select(state)

    expect(select(subject())).toBe(first)
    expect(computed).toBe(1)
  })

  it('recomputes when the key changes', () => {
    const select = createVersionedSelector<Subject, number>(
      (state) => [state.version],
      (state) => state.items.length + state.version,
    )

    expect(select(subject({ version: 1 }))).toBe(3)
    expect(select(subject({ version: 2, items: ['a'] }))).toBe(3)
    expect(select(subject({ version: 3, items: ['a'] }))).toBe(4)
  })

  it('compares every element of a composite key', () => {
    let computed = 0
    const select = createVersionedSelector<Subject, string>(
      (state) => [state.version, state.breakpoint],
      (state) => {
        computed += 1

        return `${state.version}:${state.breakpoint}`
      },
    )

    select(subject())
    select(subject({ breakpoint: 'lg' }))
    select(subject({ breakpoint: 'lg' }))

    expect(computed).toBe(2)
  })

  /**
   * ADR-055. The cache lives in this module while `version` lives in a store, so a scalar key lets
   * one caller read another's result. Every test file that builds a second store is this case.
   */
  it('does not confuse two subjects that share a scalar but not an identity', () => {
    const one = { document: { id: 'one' }, version: 0 }
    const two = { document: { id: 'two' }, version: 0 }
    const select = createVersionedSelector<typeof one, string>(
      (state) => [state.document],
      (state) => state.document.id,
    )

    expect(select(one)).toBe('one')
    expect(select(two)).toBe('two')
  })
})
