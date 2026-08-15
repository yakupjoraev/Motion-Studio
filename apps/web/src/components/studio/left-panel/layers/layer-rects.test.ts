import { type NodeId, blockId, nodeId } from '@motion-studio/schema'
import { DENSITY } from '@motion-studio/ui'
import { describe, expect, it } from 'vitest'

import { createLayerRectSource, subtreeSpans } from './layer-rects'
import type { LayerRowView } from './use-flat-layers'

const id = (name: string): NodeId => nodeId(`node_${name}`)

const row = (name: string, depth: number, hasChildren = false): LayerRowView => ({
  id: id(name),
  parentId: null,
  blockId: blockId('section'),
  name,
  depth,
  hidden: false,
  locked: false,
  hasChildren,
  expanded: hasChildren,
  setSize: 1,
  posInSet: 1,
})

/** root ▸ a ▸ (a1, a2), root ▸ b — indices 0…4. */
const ROWS: readonly LayerRowView[] = [
  row('root', 0, true),
  row('a', 1, true),
  row('a1', 2),
  row('a2', 2),
  row('b', 1),
]

const H = DENSITY.layerRow

describe('subtreeSpans — ADR-133', () => {
  it('gives a container the strip its descendants occupy, not its own row', () => {
    const spans = subtreeSpans(ROWS)

    expect(spans.get(id('root'))).toEqual({ top: H, height: 4 * H })
    expect(spans.get(id('a'))).toEqual({ top: 2 * H, height: 2 * H })
  })

  it('gives a row with nothing under it its own row, so it can be dropped into', () => {
    const spans = subtreeSpans(ROWS)

    expect(spans.get(id('a1'))).toEqual({ top: 2 * H, height: H })
    expect(spans.get(id('b'))).toEqual({ top: 4 * H, height: H })
  })

  it('leaves no gap between siblings, which is what makes every position reachable', () => {
    const spans = subtreeSpans(ROWS)
    const a = spans.get(id('a'))
    const b = spans.get(id('b'))

    expect(a).toBeDefined()
    expect(b).toBeDefined()
    expect((a?.top ?? 0) + (a?.height ?? 0)).toBe(b?.top)
  })
})

/** A 200 px viewport at y = 100, scrolled to the top unless a test says otherwise. */
const viewport = (scrollTop = 0): HTMLElement => {
  const element = document.createElement('div')

  Object.defineProperty(element, 'scrollTop', { value: scrollTop, writable: true })
  element.getBoundingClientRect = () =>
    ({ top: 100, bottom: 300, left: 0, right: 240, width: 240, height: 200 }) as DOMRect

  return element
}

describe('createLayerRectSource', () => {
  it('puts the spans in screen space, under the scroll', () => {
    const rects = createLayerRectSource()

    rects.set(subtreeSpans(ROWS), ROWS, viewport(0))

    expect(rects.get(id('a1'))).toEqual({ x: 0, y: 100 + 2 * H, width: 240, height: H })

    const scrolled = createLayerRectSource()

    scrolled.set(subtreeSpans(ROWS), ROWS, viewport(2 * H))

    expect(scrolled.get(id('a1'))).toMatchObject({ y: 100 })
  })

  it('clips to the viewport and drops what has scrolled out of it', () => {
    const rects = createLayerRectSource()

    rects.set(subtreeSpans(ROWS), ROWS, viewport(4 * H))

    // `a1` sits one row above the top of the viewport once the list is scrolled four rows down.
    expect(rects.get(id('a1'))).toBeUndefined()
    expect(rects.get(id('root'))).toMatchObject({ y: 100 })
  })

  it('answers which row is under a point, and refuses points outside the list', () => {
    const rects = createLayerRectSource()

    rects.set(subtreeSpans(ROWS), ROWS, viewport(0))

    expect(rects.rowAt({ x: 20, y: 100 + H + 1 })).toBe(id('a'))
    expect(rects.rowAt({ x: 20, y: 50 })).toBeNull()
    expect(rects.rowAt({ x: 20, y: 290 })).toBeNull()
  })

  it('knows nothing before the tree has published anything', () => {
    expect(createLayerRectSource().get(id('a'))).toBeUndefined()
  })
})
