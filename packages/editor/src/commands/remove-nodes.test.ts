import {
  type Asset,
  type MotionDocument,
  assetId,
  doc,
  effectId,
  node,
  nodeId,
  tree,
  validateDocument,
} from '@motion-studio/schema'
import { describe, expect, it } from 'vitest'

import { codeOf, harness, id } from '../test/harness'

import { COMMAND_CODES } from './guards'
import { removeNodes } from './remove-nodes'

const asset = (name: string): Asset => ({
  id: assetId(name),
  kind: 'image',
  source: { type: 'url', url: `https://example.com/${name}.png` },
  width: 100,
  height: 100,
  alt: '',
})

const withAssets = (): MotionDocument => {
  const nodes = tree({ root: ['a', 'b'], a: ['a1'] }).map((entry) =>
    entry.id === id('a1')
      ? { ...entry, props: { image: assetId('asset_used') } }
      : entry.id === id('b')
        ? { ...entry, props: { image: assetId('asset_kept') } }
        : entry,
  )

  return doc(nodes, {
    assets: {
      [assetId('asset_used')]: asset('asset_used'),
      [assetId('asset_kept')]: asset('asset_kept'),
      [assetId('asset_idle')]: asset('asset_idle'),
    },
  })
}

describe('removeNodes', () => {
  it('removes the whole subtree and leaves no orphans', () => {
    const harnessed = harness({ document: doc(tree({ root: ['a', 'b'], a: ['a1', 'a2'] })) })

    harnessed.store.getState().dispatch(removeNodes({ ids: [id('a')] }))

    const document = harnessed.document()

    expect(Object.keys(document.nodes)).toEqual([id('root'), id('b')])
    expect(document.nodes[id('root')]?.children).toEqual([id('b')])
    expect(validateDocument(document)).toEqual({ ok: true, value: undefined })
  })

  it('refuses to remove the root', () => {
    const harnessed = harness()

    expect(
      codeOf(() => harnessed.store.getState().dispatch(removeNodes({ ids: [id('root')] }))),
    ).toBe(COMMAND_CODES.rootProtected)
  })

  it('reports a node that is not there', () => {
    const harnessed = harness()

    expect(
      codeOf(() =>
        harnessed.store.getState().dispatch(removeNodes({ ids: [nodeId('node_absent')] })),
      ),
    ).toBe('NODE_NOT_FOUND')
  })

  it('releases the assets only the removed nodes referenced', () => {
    const harnessed = harness({ document: withAssets() })

    harnessed.store.getState().dispatch(removeNodes({ ids: [id('a')] }))

    expect(Object.keys(harnessed.document().assets)).toEqual([
      assetId('asset_kept'),
      assetId('asset_idle'),
    ])
  })

  it('keeps an asset a surviving node still references', () => {
    const shared = doc(
      tree({ root: ['a', 'b'] }).map((entry) => ({
        ...entry,
        props: entry.id === id('root') ? {} : { image: assetId('asset_shared') },
      })),
      { assets: { [assetId('asset_shared')]: asset('asset_shared') } },
    )
    const harnessed = harness({ document: shared })

    harnessed.store.getState().dispatch(removeNodes({ ids: [id('a')] }))

    expect(Object.keys(harnessed.document().assets)).toEqual([assetId('asset_shared')])
  })

  it('finds a reference inside an override and inside an effect', () => {
    const document = doc(
      [
        node({ id: id('root'), slot: 'root', children: [id('a')] }),
        node({
          id: id('a'),
          parentId: id('root'),
          responsive: { md: { image: assetId('asset_md') } },
          effects: [
            {
              id: 'fx_1',
              effectId: effectId('noise-overlay'),
              params: { texture: assetId('asset_fx') },
              layer: 'behind',
              blendMode: 'normal',
              opacity: 1,
            },
          ],
        }),
      ],
      {
        assets: {
          [assetId('asset_md')]: asset('asset_md'),
          [assetId('asset_fx')]: asset('asset_fx'),
        },
      },
    )
    const harnessed = harness({ document })

    harnessed.store.getState().dispatch(removeNodes({ ids: [id('a')] }))

    expect(harnessed.document().assets).toEqual({})
  })
})
