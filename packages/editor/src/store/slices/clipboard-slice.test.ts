import {
  type BlockRegistry,
  blockId,
  doc,
  fakeRegistry,
  fixtureBlockId,
  node,
  tree,
  validateDocument,
} from '@motion-studio/schema'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CLIPBOARD_CODES } from '../../clipboard/clipboard.types'
import { CLIPBOARD_MARKER } from '../../clipboard/system-clipboard'
import { cardSchema, cards, fakeSystemClipboard, studio } from '../../test/clipboard'
import { harness, id } from '../../test/harness'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('clipboard slice', () => {
  it('copies to the store and to the system clipboard', async () => {
    const clipboard = fakeSystemClipboard()

    vi.stubGlobal('navigator', { clipboard })

    const harnessed = studio()

    await harnessed.store.getState().copy([id('a')])

    expect(harnessed.store.getState().clipboard.nodes?.rootIds).toEqual([id('a')])
    expect(clipboard.value().startsWith(CLIPBOARD_MARKER)).toBe(true)
  })

  it('pastes a copy beside the original, with new ids, and selects it', async () => {
    const harnessed = studio()
    const state = harnessed.store.getState()

    await state.copy([id('a')])
    harnessed.store.getState().select([id('a')])

    const result = await harnessed.store.getState().paste()

    expect(result.ok).toBe(true)

    const document = harnessed.document()
    const children = document.nodes[id('root')]?.children ?? []
    const pastedId = children[1]

    expect(children).toHaveLength(3)
    expect(pastedId).not.toBe(id('a'))
    expect(document.nodes[pastedId ?? id('a')]?.props).toEqual({ title: 'Starter', glass: true })
    expect(harnessed.store.getState().selection.ids).toEqual([pastedId])
    expect(validateDocument(document)).toEqual({ ok: true, value: undefined })
  })

  it('carries a copy from one store to another through the system clipboard', async () => {
    const clipboard = fakeSystemClipboard()

    vi.stubGlobal('navigator', { clipboard })

    const first = studio()
    const second = studio(doc(tree({ root: [] })))

    await first.store.getState().copy([id('a')])

    const result = await second.store.getState().paste()

    expect(result.ok).toBe(true)
    expect(second.document().nodes[id('root')]?.children).toHaveLength(1)
    expect(second.store.getState().clipboard.nodes).toBeNull()
  })

  it('falls back to the store when the system clipboard refuses to write', async () => {
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: async (): Promise<void> => {
          throw new Error('Write permission denied')
        },
      },
    })

    const harnessed = studio()

    await harnessed.store.getState().copy([id('a')])

    expect((await harnessed.store.getState().paste()).ok).toBe(true)
    expect(harnessed.document().nodes[id('root')]?.children).toHaveLength(3)
  })

  it('reports an empty clipboard rather than pasting nothing quietly', async () => {
    const result = await studio().store.getState().paste()

    expect(result.ok).toBe(false)
    expect(result.ok ? '' : result.error.code).toBe(CLIPBOARD_CODES.empty)
  })

  it('reports its own marker in front of broken JSON', async () => {
    vi.stubGlobal('navigator', {
      clipboard: { readText: async (): Promise<string> => `${CLIPBOARD_MARKER}\n{ "rootIds":` },
    })

    const result = await studio().store.getState().paste()

    expect(result.ok ? '' : result.error.code).toBe(CLIPBOARD_CODES.notJson)
  })

  it('ignores foreign clipboard text and uses the store payload', async () => {
    vi.stubGlobal('navigator', {
      clipboard: { readText: async (): Promise<string> => 'const hello = 1' },
    })

    const harnessed = studio()

    await harnessed.store.getState().copy([id('a')])

    expect((await harnessed.store.getState().paste()).ok).toBe(true)
  })

  it('pastes what it can and names the blocks it could not', async () => {
    const source = doc([
      node({ id: id('root'), slot: 'root', children: [id('a'), id('hero')] }),
      node({
        id: id('a'),
        blockId: fixtureBlockId('card'),
        parentId: id('root'),
        slot: 'children',
      }),
      node({
        id: id('hero'),
        blockId: blockId('custom-hero'),
        parentId: id('root'),
        slot: 'children',
        children: [id('h1')],
      }),
      node({
        id: id('h1'),
        blockId: blockId('custom-hero'),
        parentId: id('hero'),
        slot: 'children',
      }),
    ])
    const harnessed = studio(source)

    await harnessed.store.getState().copy([id('a'), id('hero')])

    const result = await harnessed.store.getState().paste()

    expect(result.ok).toBe(true)

    if (!result.ok) {
      return
    }

    expect(result.value.pasted).toBe(1)
    expect(result.value.requested).toBe(3)
    expect(result.value.message).toBe(
      'Pasted 1 of 3 blocks. 2 blocks are not available (`custom-hero`).',
    )
  })

  it('writes one history entry for a five-node paste', async () => {
    const deep = doc(tree({ root: ['a'], a: ['a1', 'a2'], a1: ['a1x', 'a1y'] }))
    const harnessed = studio(deep)

    await harnessed.store.getState().copy([id('a')])

    const before = harnessed.store.getState().history.past.length

    await harnessed.store.getState().paste()

    expect(harnessed.store.getState().history.past).toHaveLength(before + 1)
    expect(Object.keys(harnessed.document().nodes)).toHaveLength(11)
  })

  it('cuts by copying and then removing', async () => {
    const harnessed = studio()

    await harnessed.store.getState().cut([id('a')])

    expect(harnessed.document().nodes[id('a')]).toBeUndefined()
    expect(harnessed.store.getState().clipboard.nodes?.rootIds).toEqual([id('a')])

    const result = await harnessed.store.getState().paste()

    expect(result.ok).toBe(true)
    expect(harnessed.document().nodes[id('root')]?.children).toHaveLength(2)
  })

  it('puts a paste in place back at the index it was cut from', async () => {
    const harnessed = studio()

    await harnessed.store.getState().cut([id('a')])
    await harnessed.store.getState().pasteInPlace()

    const children = harnessed.document().nodes[id('root')]?.children ?? []

    expect(children).toHaveLength(2)
    expect(harnessed.document().nodes[children[0] ?? id('a')]?.props['title']).toBe('Starter')
  })

  it('honours an explicit target over the resolution', async () => {
    const harnessed = studio()

    await harnessed.store.getState().copy([id('a')])
    await harnessed.store.getState().paste({ parentId: id('root'), slot: 'children', index: 0 })

    expect(harnessed.document().nodes[id('root')]?.children[0]).not.toBe(id('a'))
  })

  it('rejects a paste with nowhere to go', async () => {
    const harnessed = studio()

    await harnessed.store.getState().copy([id('a')])

    const closed = studio(
      doc([node({ id: id('root'), blockId: fixtureBlockId('card'), slot: 'root' })]),
    )

    closed.store.setState({ clipboard: harnessed.store.getState().clipboard })

    const result = await closed.store.getState().paste()

    expect(result.ok ? '' : result.error.code).toBe(CLIPBOARD_CODES.targetRejected)
  })

  it('reports a slot that has no room left, and changes nothing', async () => {
    const oneChild: BlockRegistry = fakeRegistry({
      container: {
        slots: [
          { name: 'children', label: 'Children', accepts: '*', minChildren: 0, maxChildren: 2 },
        ],
      },
      card: { propsSchema: cardSchema, defaults: { title: '', glass: false }, slots: [] },
    })
    const harnessed = harness({ registry: oneChild, document: cards() })

    await harnessed.store.getState().copy([id('a'), id('b')])

    const before = harnessed.document()
    const result = await harnessed.store
      .getState()
      .paste({ parentId: id('root'), slot: 'children', index: 0 })

    expect(result.ok ? '' : result.error.code).toBe('SLOT_FULL')
    expect(harnessed.document()).toEqual(before)
  })

  it('lets a defect in a registry predicate through instead of reporting it as a rejection', async () => {
    const throwing: BlockRegistry = fakeRegistry({
      container: {
        slots: [
          {
            name: 'children',
            label: 'Children',
            accepts: (): boolean => {
              throw new TypeError('the predicate is broken')
            },
            minChildren: 0,
            maxChildren: null,
          },
        ],
      },
      card: { propsSchema: cardSchema, defaults: { title: '', glass: false }, slots: [] },
    })
    const harnessed = studio()

    await harnessed.store.getState().copy([id('a')])

    const broken = harness({ registry: throwing, document: cards() })

    broken.store.setState({ clipboard: harnessed.store.getState().clipboard })

    await expect(
      broken.store.getState().paste({ parentId: id('root'), slot: 'children', index: 0 }),
    ).rejects.toThrow('the predicate is broken')
  })

  it('copies nothing when the selection has no nodes left', async () => {
    const harnessed = studio()

    await harnessed.store.getState().copy([id('gone')])

    expect(harnessed.store.getState().clipboard.nodes).toBeNull()
  })
})
