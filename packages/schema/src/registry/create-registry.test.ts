import { describe, expect, it } from 'vitest'

import { blockId } from '../ids/ids'
import { fakeRegistry } from '../test/factories'

import { DuplicateBlockError, UnknownBlockError, createRegistry } from './create-registry'
import type { BlockDefinition } from './registry.types'

const registry = () =>
  fakeRegistry({
    container: { category: 'layout' },
    'hero-aurora': { category: 'hero' },
    'pricing-table': { category: 'marketing' },
  })

describe('createRegistry', () => {
  it('finds a definition by id', () => {
    expect(registry().get(blockId('hero-aurora'))?.category).toBe('hero')
  })

  it('returns undefined for a block it does not have', () => {
    expect(registry().get(blockId('nope'))).toBeUndefined()
  })

  it('throws from require, which is for the paths where a miss is a programmer mistake', () => {
    expect(() => registry().require(blockId('nope'))).toThrow(UnknownBlockError)
    expect(registry().require(blockId('container')).id).toBe('container')
  })

  it('lists in the order it was given', () => {
    expect(
      registry()
        .list()
        .map((definition) => definition.id),
    ).toEqual(['container', 'hero-aurora', 'pricing-table'])
  })

  it('filters by category', () => {
    expect(
      registry()
        .byCategory('hero')
        .map((definition) => definition.id),
    ).toEqual(['hero-aurora'])
    expect(registry().byCategory('forms')).toEqual([])
  })

  it('refuses two definitions claiming one id, at construction', () => {
    const definitions = fakeRegistry({ container: {} }).list()

    expect(() => createRegistry([...definitions, ...definitions] as BlockDefinition[])).toThrow(
      DuplicateBlockError,
    )
  })

  it('is not affected by a later change to the array it was built from', () => {
    const definitions = [...fakeRegistry({ container: {} }).list()]
    const built = createRegistry(definitions)

    definitions.length = 0

    expect(built.list()).toHaveLength(1)
  })
})
