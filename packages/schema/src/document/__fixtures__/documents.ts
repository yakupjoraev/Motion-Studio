import { assetId, effectId, nodeId } from '../../ids/ids'
import { doc, node, resetFactories, tree, treeId } from '../../test/factories'
import type { Asset, MotionDocument, Node } from '../document.types'

/**
 * Twenty documents that between them touch every optional branch of the format: empty and deep trees,
 * responsive overrides, each motion trigger kind, effects, both asset sources, and the fields that are
 * optional. The serialization tests run over all of them, which is what makes "byte-stable" a claim
 * about the format rather than about one lucky shape.
 */
const asset = (index: number, overrides: Partial<Asset> = {}): Asset => ({
  id: assetId(`asset_${index}`),
  kind: 'image',
  source: { type: 'url', url: `https://images.example.com/${index}.webp` },
  width: 1200,
  height: 800,
  alt: `Fixture ${index}`,
  ...overrides,
})

const withEffects = (entry: Node): Node => ({
  ...entry,
  effects: [
    {
      id: 'fx_1',
      effectId: effectId('noise-overlay'),
      params: { amount: 0.03 },
      layer: 'front',
      blendMode: 'overlay',
      opacity: 1,
    },
    {
      id: 'fx_2',
      effectId: effectId('glow'),
      params: { radius: 120, colour: 'accent' },
      layer: 'behind',
      blendMode: 'screen',
      opacity: 0.6,
    },
  ],
})

const withMotion = (entry: Node): Node => ({
  ...entry,
  motion: {
    entrance: {
      presetId: 'fade-up',
      channel: 'entrance',
      trigger: { kind: 'inView', amount: 0.3, once: true, margin: '-10%' },
      params: { distance: 32, duration: 600 },
      stagger: { each: 60, from: 'first' },
    },
    hover: {
      presetId: 'lift',
      channel: 'hover',
      trigger: { kind: 'hover' },
      params: { scale: 1.02 },
    },
  },
})

const withResponsive = (entry: Node): Node => ({
  ...entry,
  props: { columns: 1, gap: 16, align: 'center' },
  responsive: { md: { columns: 2, align: 'left' }, lg: { columns: 3, gap: 24 } },
})

export function fixtureDocuments(): readonly MotionDocument[] {
  resetFactories()

  const flat = tree({ root: ['a', 'b'] })
  const deep = tree({ root: ['a'], a: ['b'], b: ['c'], c: ['d'], d: [] })
  const wide = tree({ root: ['a', 'b', 'c', 'd', 'e'], a: [], b: [], c: [], d: [], e: [] })

  const rootOf = () => ({ rootId: treeId('root') })

  return [
    doc(tree({ root: [] }), rootOf()),
    doc(flat, rootOf()),
    doc(deep, rootOf()),
    doc(wide, rootOf()),
    doc(flat.map(withMotion), rootOf()),
    doc(flat.map(withEffects), rootOf()),
    doc(flat.map(withResponsive), rootOf()),
    doc(deep.map(withMotion).map(withEffects), rootOf()),
    doc(flat, { ...rootOf(), assets: { [assetId('asset_1')]: asset(1) } }),
    doc(flat, {
      ...rootOf(),
      assets: {
        [assetId('asset_1')]: asset(1, {
          source: { type: 'data', dataUrl: 'data:image/png;base64,AAAA' },
        }),
      },
    }),
    doc(flat, {
      ...rootOf(),
      assets: {
        [assetId('asset_1')]: asset(1, { blurDataUrl: 'data:image/webp;base64,UklGRg==' }),
      },
    }),
    doc(flat, { ...rootOf(), $schema: 'https://motion-studio.dev/schema/v1.json' }),
    doc(flat, { ...rootOf(), meta: { ...doc(flat).meta, template: true } }),
    doc(flat, { ...rootOf(), meta: { ...doc(flat).meta, name: 'Landing page' } }),
    doc(
      flat.map((entry) => ({ ...entry, locked: true, hidden: true })),
      rootOf(),
    ),
    doc(
      flat.map((entry) => ({
        ...entry,
        motion: {
          scroll: {
            presetId: 'parallax',
            channel: 'scroll' as const,
            trigger: { kind: 'scrollProgress' as const, start: 'top bottom', end: 'bottom top' },
            params: { distance: 80 },
          },
        },
      })),
      rootOf(),
    ),
    doc(
      flat.map((entry) => ({
        ...entry,
        motion: {
          cursor: {
            presetId: 'magnetic',
            channel: 'cursor' as const,
            trigger: { kind: 'pointerMove' as const, within: 'element' as const },
            params: { strength: 0.4 },
          },
        },
      })),
      rootOf(),
    ),
    doc(
      flat.map((entry) => ({
        ...entry,
        motion: {
          continuous: {
            presetId: 'float',
            channel: 'continuous' as const,
            trigger: { kind: 'always' as const },
            params: { amplitude: 6 },
            disabled: true,
          },
        },
      })),
      rootOf(),
    ),
    doc([...flat, node({ id: nodeId('node_extra'), parentId: treeId('root') })], {
      ...rootOf(),
      nodes: Object.fromEntries([
        ...flat.map((entry) =>
          entry.id === treeId('root')
            ? [entry.id, { ...entry, children: [...entry.children, nodeId('node_extra')] }]
            : [entry.id, entry],
        ),
        [
          nodeId('node_extra'),
          node({ id: nodeId('node_extra'), parentId: treeId('root'), name: 'Extra' }),
        ],
      ] as [string, Node][]) as MotionDocument['nodes'],
    }),
    doc(wide.map(withResponsive).map(withEffects), rootOf()),
  ]
}
