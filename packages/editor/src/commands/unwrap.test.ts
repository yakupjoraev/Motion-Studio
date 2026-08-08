import { doc, fixtureBlockId, node, tree, validateDocument } from '@motion-studio/schema'
import { describe, expect, it } from 'vitest'

import { codeOf, harness, id } from '../test/harness'

import { COMMAND_CODES } from './guards'
import { unwrap } from './unwrap'

describe('unwrap', () => {
  it('hoists the children into the wrapper’s place and deletes the wrapper', () => {
    const harnessed = harness({ document: doc(tree({ root: ['a', 'b'], a: ['a1', 'a2'] })) })

    harnessed.store.getState().dispatch(unwrap({ nodeId: id('a') }))

    const document = harnessed.document()

    expect(document.nodes[id('root')]?.children).toEqual([id('a1'), id('a2'), id('b')])
    expect(document.nodes[id('a1')]?.parentId).toBe(id('root'))
    expect(document.nodes[id('a1')]?.slot).toBe('children')
    expect(document.nodes[id('a')]).toBeUndefined()
    expect(validateDocument(document)).toEqual({ ok: true, value: undefined })
  })

  it('removes an empty wrapper', () => {
    const harnessed = harness()

    harnessed.store.getState().dispatch(unwrap({ nodeId: id('a') }))

    expect(harnessed.document().nodes[id('root')]?.children).toEqual([id('b'), id('c'), id('d')])
  })

  it('refuses the root', () => {
    const harnessed = harness()

    expect(codeOf(() => harnessed.store.getState().dispatch(unwrap({ nodeId: id('root') })))).toBe(
      COMMAND_CODES.rootProtected,
    )
  })

  it('rejects children the wrapper’s parent will not accept', () => {
    const document = doc([
      node({
        id: id('root'),
        blockId: fixtureBlockId('section'),
        slot: 'root',
        children: [id('a')],
      }),
      node({
        id: id('a'),
        blockId: fixtureBlockId('container'),
        parentId: id('root'),
        children: [id('a1')],
      }),
      node({ id: id('a1'), blockId: fixtureBlockId('leaf'), parentId: id('a') }),
    ])
    const harnessed = harness({ document })

    expect(codeOf(() => harnessed.store.getState().dispatch(unwrap({ nodeId: id('a') })))).toBe(
      COMMAND_CODES.slotRejectsBlock,
    )
  })

  it('rejects children that would overfill the parent slot', () => {
    const document = doc([
      node({
        id: id('root'),
        blockId: fixtureBlockId('section'),
        slot: 'root',
        children: [id('a'), id('b')],
      }),
      node({
        id: id('a'),
        blockId: fixtureBlockId('container'),
        parentId: id('root'),
        children: [id('a1'), id('a2')],
      }),
      node({ id: id('b'), blockId: fixtureBlockId('card'), parentId: id('root') }),
      node({ id: id('a1'), blockId: fixtureBlockId('card'), parentId: id('a') }),
      node({ id: id('a2'), blockId: fixtureBlockId('card'), parentId: id('a') }),
    ])
    const harnessed = harness({ document })

    expect(codeOf(() => harnessed.store.getState().dispatch(unwrap({ nodeId: id('a') })))).toBe(
      COMMAND_CODES.slotFull,
    )
  })
})
