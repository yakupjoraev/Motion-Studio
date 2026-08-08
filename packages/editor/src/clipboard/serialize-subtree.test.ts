import {
  type Asset,
  type MotionDocument,
  assetId,
  doc,
  effectId,
  node,
  tree,
} from '@motion-studio/schema'
import { studioDark } from '@motion-studio/theme'
import { describe, expect, it } from 'vitest'

import { id } from '../test/harness'

import { serializeSubtree } from './serialize-subtree'

const asset = (name: string): Asset => ({
  id: assetId(`asset_${name}`),
  kind: 'image',
  source: { type: 'url', url: `https://images.example.com/${name}.webp` },
  width: 1200,
  height: 800,
  alt: name,
})

const withAssets = (): MotionDocument =>
  doc(
    tree({ root: ['a', 'b'], a: ['a1'] }).map((entry) =>
      entry.id === id('a1') ? { ...entry, props: { image: 'asset_used' } } : entry,
    ),
    {
      assets: { [assetId('asset_used')]: asset('used'), [assetId('asset_spare')]: asset('spare') },
    },
  )

describe('serializeSubtree', () => {
  it('carries every descendant of the roots', () => {
    const subtree = serializeSubtree(doc(tree({ root: ['a', 'b'], a: ['a1', 'a2'] })), [id('a')])

    expect(Object.keys(subtree.nodes).sort()).toEqual([id('a'), id('a1'), id('a2')].sort())
    expect(subtree.rootIds).toEqual([id('a')])
  })

  it('carries the assets the subtree references and no others', () => {
    const subtree = serializeSubtree(withAssets(), [id('a')])

    expect(Object.keys(subtree.assets)).toEqual([assetId('asset_used')])
  })

  it('records the index each root occupied', () => {
    const subtree = serializeSubtree(doc(tree({ root: ['a', 'b', 'c'] })), [id('b'), id('c')])

    expect(subtree.origins).toEqual({ [id('b')]: 1, [id('c')]: 2 })
  })

  it('carries the palette for a cross-document paste', () => {
    const subtree = serializeSubtree(doc(tree({ root: ['a'] })), [id('a')])

    expect(subtree.theme).toEqual({ palette: studioDark.palette })
  })

  it('finds an asset referenced from a list prop and from an effect', () => {
    const document = doc(
      [
        node({ id: id('root'), slot: 'root', children: [id('a')] }),
        node({
          id: id('a'),
          parentId: id('root'),
          props: { slides: [{ image: 'asset_used' }] },
          effects: [
            {
              id: 'fx_1',
              effectId: effectId('noise-overlay'),
              params: { texture: 'asset_spare' },
              layer: 'front',
              blendMode: 'normal',
              opacity: 1,
            },
          ],
        }),
      ],
      {
        assets: {
          [assetId('asset_used')]: asset('used'),
          [assetId('asset_spare')]: asset('spare'),
        },
      },
    )

    expect(Object.keys(serializeSubtree(document, [id('a')]).assets).sort()).toEqual([
      assetId('asset_spare'),
      assetId('asset_used'),
    ])
  })

  it('skips a root the document does not have', () => {
    const subtree = serializeSubtree(doc(tree({ root: ['a'] })), [id('a'), id('gone')])

    expect(subtree.rootIds).toEqual([id('a')])
  })
})
