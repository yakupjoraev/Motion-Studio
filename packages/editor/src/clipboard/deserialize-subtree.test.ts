import {
  type Asset,
  type BlockRegistry,
  type MotionDocument,
  type NodeId,
  assetId,
  blockId,
  doc,
  fakeRegistry,
  node,
  nodeId,
  tree,
  validateDocument,
} from '@motion-studio/schema'
import { assertDefined, counterIds } from '@motion-studio/utils'
import { describe, expect, it } from 'vitest'

import { id } from '../test/harness'

import { CLIPBOARD_CODES, type SerializedSubtree } from './clipboard.types'
import { deserializeSubtree } from './deserialize-subtree'
import { serializeSubtree } from './serialize-subtree'

const registry: BlockRegistry = fakeRegistry({ container: {}, card: {} })

const options = (document: MotionDocument): Parameters<typeof deserializeSubtree>[1] => {
  const next = counterIds()

  return { registry, generateId: (): NodeId => nodeId(next()), document }
}

const firstRoot = (subtree: SerializedSubtree): NodeId =>
  assertDefined(subtree.rootIds[0], 'the subtree has a root')

const asset = (): Asset => ({
  id: assetId('asset_hero'),
  kind: 'image',
  source: { type: 'url', url: 'https://images.example.com/hero.webp' },
  width: 1200,
  height: 800,
  alt: 'Hero',
})

/** `a` holds a child, an asset reference, a shared-layout key and a pointer at its own child. */
const source = (): MotionDocument =>
  doc(
    tree({ root: ['a'], a: ['a1'] }).map((entry) =>
      entry.id === id('a')
        ? { ...entry, props: { image: 'asset_hero', layoutId: 'hero', target: id('a1') } }
        : entry,
    ),
    { assets: { [assetId('asset_hero')]: asset() } },
  )

const idsIn = (value: unknown, found: Set<string> = new Set()): ReadonlySet<string> => {
  if (typeof value === 'string') {
    found.add(value)
  } else if (Array.isArray(value)) {
    for (const item of value) {
      idsIn(item, found)
    }
  } else if (typeof value === 'object' && value !== null) {
    for (const item of Object.values(value)) {
      idsIn(item, found)
    }
  }

  return found
}

describe('deserializeSubtree', () => {
  it('round-trips a subtree with every id replaced', () => {
    const document = source()
    const payload = serializeSubtree(document, [id('a')])
    const result = deserializeSubtree(payload, options(document))

    expect(result.ok).toBe(true)

    if (!result.ok) {
      return
    }

    const { subtree } = result.value
    const carried = idsIn(subtree)
    const sourceIds = [id('a'), id('a1'), 'asset_hero', 'hero']

    expect(Object.keys(subtree.nodes)).toHaveLength(2)

    for (const original of sourceIds) {
      expect(carried.has(original)).toBe(false)
    }
  })

  it('keeps an asset reference pointing at the asset, by its new id', () => {
    const document = source()
    const result = deserializeSubtree(serializeSubtree(document, [id('a')]), options(document))

    expect(result.ok).toBe(true)

    if (!result.ok) {
      return
    }

    const { subtree } = result.value
    const root = subtree.nodes[firstRoot(subtree)]
    const assetIds = Object.keys(subtree.assets)

    expect(assetIds).toHaveLength(1)
    expect(root?.props['image']).toBe(assetIds[0])
    expect(root?.props['target']).toBe(root?.children[0])
    expect(root?.props['layoutId']).not.toBe('hero')
  })

  it('remaps references inside a breakpoint override', () => {
    const document = doc(
      tree({ root: ['a'], a: ['a1'] }).map((entry) =>
        entry.id === id('a') ? { ...entry, responsive: { md: { target: id('a1') } } } : entry,
      ),
    )
    const result = deserializeSubtree(serializeSubtree(document, [id('a')]), options(document))

    expect(result.ok).toBe(true)

    if (!result.ok) {
      return
    }

    const root = result.value.subtree.nodes[firstRoot(result.value.subtree)]

    expect(root?.responsive.md?.['target']).toBe(root?.children[0])
  })

  it('drops an unknown block with everything under it and reports the cost', () => {
    const document = doc(
      tree({ root: ['a', 'b'], b: ['b1', 'b2'] }).map((entry) =>
        entry.id === id('b') ? { ...entry, blockId: blockId('custom-hero') } : entry,
      ),
    )
    const payload = serializeSubtree(document, [id('a'), id('b')])
    const result = deserializeSubtree(payload, options(document))

    expect(result.ok).toBe(true)

    if (!result.ok) {
      return
    }

    expect(result.value.requested).toBe(4)
    expect(Object.keys(result.value.subtree.nodes)).toHaveLength(1)
    expect(result.value.rejected).toEqual([{ blockId: blockId('custom-hero'), nodes: 3 }])
  })

  it('refuses a payload whose blocks are all unknown', () => {
    const document = doc(
      tree({ root: ['a'] }).map((entry) =>
        entry.id === id('a') ? { ...entry, blockId: blockId('custom-hero') } : entry,
      ),
    )
    const result = deserializeSubtree(serializeSubtree(document, [id('a')]), options(document))

    expect(result.ok).toBe(false)

    if (result.ok) {
      return
    }

    expect(result.error.code).toBe(CLIPBOARD_CODES.noBlocksAvailable)
    expect(result.error.message).toContain('custom-hero')
  })

  it('reports malformed JSON without touching anything', () => {
    const result = deserializeSubtree('{ "rootIds": ', options(doc(tree({ root: [] }))))

    expect(result.ok).toBe(false)
    expect(result.ok ? '' : result.error.code).toBe(CLIPBOARD_CODES.notJson)
  })

  it('rejects a payload that is not a selection', () => {
    const result = deserializeSubtree({ version: 1 }, options(doc(tree({ root: [] }))))

    expect(result.ok).toBe(false)
    expect(result.ok ? '' : result.error.code).toBe(CLIPBOARD_CODES.invalidPayload)
  })

  it('rejects a payload from a newer version', () => {
    const document = source()
    const payload = { ...serializeSubtree(document, [id('a')]), version: 99 }
    const result = deserializeSubtree(payload, options(document))

    expect(result.ok).toBe(false)
    expect(result.ok ? '' : result.error.code).toBe(CLIPBOARD_CODES.futureVersion)
  })

  it('sanitises a javascript: href and says so', () => {
    const document = doc(
      tree({ root: ['a'] }).map((entry) =>
        entry.id === id('a')
          ? { ...entry, props: { href: 'javascript:alert(document.cookie)' } }
          : entry,
      ),
    )
    const result = deserializeSubtree(serializeSubtree(document, [id('a')]), options(document))

    expect(result.ok).toBe(true)

    if (!result.ok) {
      return
    }

    const root = result.value.subtree.nodes[firstRoot(result.value.subtree)]

    expect(root?.props['href']).toBe('')
    expect(result.value.removed).toHaveLength(1)
    expect(result.value.removed[0]?.kind).toBe('UNSAFE_URL')
  })

  it('accepts the text a copy wrote, marker stripped', () => {
    const document = source()
    const text = JSON.stringify(serializeSubtree(document, [id('a')]))
    const result = deserializeSubtree(text, options(document))

    expect(result.ok).toBe(true)
  })

  it('drops a child the payload does not carry', () => {
    const document = doc([
      node({ id: id('root'), slot: 'root', children: [id('a')] }),
      node({
        id: id('a'),
        parentId: id('root'),
        slot: 'children',
        children: [id('a1'), id('missing')],
      }),
      node({ id: id('a1'), parentId: id('a'), slot: 'children' }),
    ])
    const result = deserializeSubtree(serializeSubtree(document, [id('a')]), options(document))

    expect(result.ok).toBe(true)

    if (!result.ok) {
      return
    }

    const root = result.value.subtree.nodes[firstRoot(result.value.subtree)]

    expect(root?.children).toHaveLength(1)
  })

  it('produces a subtree that keeps the document valid once pasted', () => {
    const document = source()
    const result = deserializeSubtree(serializeSubtree(document, [id('a')]), options(document))

    expect(result.ok).toBe(true)

    if (!result.ok) {
      return
    }

    const { subtree } = result.value
    const rootId = firstRoot(subtree)
    const pasted = doc(
      [
        node({ id: id('page'), slot: 'root', children: [rootId] }),
        ...Object.values(subtree.nodes).map((entry) =>
          entry.id === rootId ? { ...entry, parentId: id('page') } : entry,
        ),
      ],
      { assets: subtree.assets },
    )

    expect(validateDocument(pasted)).toEqual({ ok: true, value: undefined })
  })
})
