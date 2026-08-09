import { blockId } from '@motion-studio/schema'
import { describe, expect, it } from 'vitest'

import { DEFINITIONS } from './registry'
import {
  RegistryParityError,
  assertRegistryParity,
  registryParity,
  renderRegistry,
} from './render-registry'

const ids = DEFINITIONS.map((definition) => definition.id)

describe('registryParity', () => {
  it('is satisfied by the registry as shipped', () => {
    expect(() => assertRegistryParity()).not.toThrow()
  })

  it('names a definition whose component was removed', () => {
    const { section: _removed, ...withoutSection } = renderRegistry

    expect(registryParity(ids, withoutSection)).toEqual({ missing: ['section'], extra: [] })
  })

  it('names a component nothing defines', () => {
    expect(registryParity(ids, { ...renderRegistry, ghost: () => null })).toEqual({
      missing: [],
      extra: ['ghost'],
    })
  })

  it('throws with both halves of the mismatch in the message', () => {
    const error = new RegistryParityError(['section'], ['ghost'])

    expect(error.message).toContain('Defined with no component: section')
    expect(error.message).toContain('Component with no definition: ghost')
  })
})

describe('renderRegistry', () => {
  it('has a component per catalogue id', () => {
    for (const id of [blockId('section'), blockId('container'), blockId('heading')]) {
      expect(typeof renderRegistry[id]).toBe('function')
    }
  })
})
