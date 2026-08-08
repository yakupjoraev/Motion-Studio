import { describe, expect, expectTypeOf, it } from 'vitest'

import {
  type AssetId,
  type BlockId,
  InvalidIdError,
  type NodeId,
  assetId,
  blockId,
  effectId,
  nodeId,
  nodeIdSchema,
} from './ids'

describe('id constructors', () => {
  it.each(['node_1', 'node_abc-DEF_123', `node_${'a'.repeat(32)}`])('accepts %s', (value) => {
    expect(nodeId(value)).toBe(value)
  })

  it.each(['', 'node_', 'nope_1', 'node_!', `node_${'a'.repeat(33)}`, 'NODE_1'])(
    'rejects %s',
    (value) => {
      expect(() => nodeId(value)).toThrow(InvalidIdError)
    },
  )

  it('rejects an asset id where a node id belongs', () => {
    expect(() => nodeId('asset_1')).toThrow(InvalidIdError)
  })

  it('accepts kebab-case catalogue ids and nothing else', () => {
    expect(blockId('hero-aurora')).toBe('hero-aurora')
    expect(effectId('noise-overlay')).toBe('noise-overlay')
    expect(() => blockId('Hero')).toThrow(InvalidIdError)
    expect(() => blockId('hero_aurora')).toThrow(InvalidIdError)
    expect(() => blockId('../../etc/passwd')).toThrow(InvalidIdError)
  })

  it('names the kind in the message, so a bad id says which one it failed as', () => {
    expect(() => assetId('node_1')).toThrow(/AssetId/)
  })
})

describe('id schemas', () => {
  it('brands what it parses', () => {
    const parsed = nodeIdSchema.parse('node_7')

    expectTypeOf(parsed).toEqualTypeOf<NodeId>()
    expect(parsed).toBe('node_7')
  })

  it('reports a bad id rather than throwing on the caller', () => {
    expect(nodeIdSchema.safeParse('nope').success).toBe(false)
  })
})

describe('the brands are not interchangeable', () => {
  it('does not let a BlockId stand in for a NodeId', () => {
    expectTypeOf<BlockId>().not.toMatchTypeOf<NodeId>()
    expectTypeOf<NodeId>().not.toMatchTypeOf<BlockId>()
    expectTypeOf<AssetId>().not.toMatchTypeOf<NodeId>()
  })

  it('still lets any of them be read as a string', () => {
    expectTypeOf<NodeId>().toMatchTypeOf<string>()
  })

  it('does not let a bare string be passed as a NodeId', () => {
    expectTypeOf<string>().not.toMatchTypeOf<NodeId>()
  })
})
