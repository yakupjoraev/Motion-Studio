import { type MotionDocument, doc, nodeIds, tree, treeId } from '@motion-studio/schema'
import { counterIds } from '@motion-studio/utils'
import { describe, expect, it } from 'vitest'

import { cloneDocument } from './clone-document'

const ids = () => {
  const next = counterIds('clone')

  return (prefix: string) => `${prefix}_${next()}`
}

const withEffect = (): MotionDocument => {
  const base = doc(tree({ root: ['a'] }))

  return {
    ...base,
    nodes: {
      ...base.nodes,
      [treeId('a')]: {
        ...base.nodes[treeId('a')],
        effects: [
          {
            id: 'fx_original',
            effectId: 'noise-overlay',
            params: {},
            layer: 'front',
            blendMode: 'overlay',
            opacity: 1,
          },
        ],
        props: { image: 'asset_original' },
      },
    },
    assets: {
      asset_original: {
        id: 'asset_original',
        kind: 'image',
        source: { type: 'url', url: 'https://example.com/a.webp' },
        width: 100,
        height: 100,
        alt: 'A',
      },
    },
  } as MotionDocument
}

describe('cloneDocument', () => {
  it('shares no node id with its source', () => {
    const source = doc(tree({ root: ['a', 'b'] }))
    const copy = cloneDocument(source, { ids: ids() })

    expect(nodeIds(copy)).toHaveLength(nodeIds(source).length)
    for (const id of nodeIds(copy)) {
      expect(nodeIds(source)).not.toContain(id)
    }
  })

  it('gives the copy its own document id', () => {
    const source = doc(tree({ root: ['a'] }))

    expect(cloneDocument(source, { ids: ids() }).meta.id).not.toBe(source.meta.id)
  })

  it('keeps the tree intact through the remap', () => {
    const source = doc(tree({ root: ['a', 'b'] }))
    const copy = cloneDocument(source, { ids: ids() })
    const root = copy.nodes[copy.rootId]

    expect(root?.children).toHaveLength(2)
    for (const child of root?.children ?? []) {
      expect(copy.nodes[child]?.parentId).toBe(copy.rootId)
    }
  })

  it('remaps asset ids, including the reference inside a prop', () => {
    const copy = cloneDocument(withEffect(), { ids: ids() })
    const assetId = Object.keys(copy.assets)[0]
    const node = Object.values(copy.nodes).find((entry) => entry.props['image'] !== undefined)

    expect(assetId).not.toBe('asset_original')
    expect(node?.props['image']).toBe(assetId)
  })

  it('remaps effect instance ids', () => {
    const copy = cloneDocument(withEffect(), { ids: ids() })
    const effects = Object.values(copy.nodes).flatMap((entry) => entry.effects)

    expect(effects[0]?.id).not.toBe('fx_original')
  })

  it('drops the template flag, because a copy of a template is a document', () => {
    const source = doc(tree({ root: ['a'] }))
    const template = { ...source, meta: { ...source.meta, template: true } } as MotionDocument

    expect(cloneDocument(template, { ids: ids() }).meta.template).toBeUndefined()
  })

  it('takes the name it is given', () => {
    const source = doc(tree({ root: ['a'] }))

    expect(cloneDocument(source, { ids: ids(), name: 'Copy' }).meta.name).toBe('Copy')
  })
})
