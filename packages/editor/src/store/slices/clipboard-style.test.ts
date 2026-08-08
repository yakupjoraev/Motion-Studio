import { doc, fixtureBlockId, node } from '@motion-studio/schema'
import { describe, expect, it } from 'vitest'

import { studio } from '../../test/clipboard'
import { id } from '../../test/harness'

/** The paste-style half of the clipboard slice — `clipboard-slice.test.ts` covers the node half. */
describe('clipboard slice, paste style', () => {
  it('pastes style onto every target as one entry, leaving content alone', () => {
    const harnessed = studio()

    harnessed.store.getState().copyStyle(id('a'))

    const before = harnessed.store.getState().history.past.length

    harnessed.store.getState().pasteStyle([id('b')])

    expect(harnessed.document().nodes[id('b')]?.props).toEqual({ title: 'Pro', glass: true })
    expect(harnessed.store.getState().history.past).toHaveLength(before + 1)
  })

  it('does nothing when there is no style to paste, or no such node to copy from', () => {
    const harnessed = studio()

    harnessed.store.getState().pasteStyle([id('b')])

    expect(harnessed.store.getState().history.past).toHaveLength(0)

    harnessed.store.getState().copyStyle(id('gone'))

    expect(harnessed.store.getState().clipboard.style).toBeNull()
  })

  it('skips a paste-style target the document has lost', () => {
    const harnessed = studio()

    harnessed.store.getState().copyStyle(id('a'))
    harnessed.store.getState().pasteStyle([id('gone')])

    expect(harnessed.store.getState().history.past).toHaveLength(0)
  })

  it('skips a style prop the target block does not have', () => {
    const mixed = doc([
      node({ id: id('root'), slot: 'root', children: [id('a'), id('plain')] }),
      node({
        id: id('a'),
        blockId: fixtureBlockId('card'),
        parentId: id('root'),
        slot: 'children',
        props: { title: 'Starter', glass: true },
      }),
      node({ id: id('plain'), parentId: id('root'), slot: 'children', props: { title: 'Plain' } }),
    ])
    const harnessed = studio(mixed)

    harnessed.store.getState().copyStyle(id('a'))
    harnessed.store.getState().pasteStyle([id('plain')])

    expect(harnessed.document().nodes[id('plain')]?.props).toEqual({ title: 'Plain', glass: true })
  })
})
