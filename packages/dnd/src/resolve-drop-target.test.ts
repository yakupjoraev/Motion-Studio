import { blockId, nodeId, resetFactories } from '@motion-studio/schema'
import { beforeEach, describe, expect, it } from 'vitest'

import { type ResolveDropTargetArgs, resolveDropTarget } from './resolve-drop-target'
import { build, dropRegistry, id, rect, rectsFrom } from './test/drop'

const registry = dropRegistry()

/** A vertical page of three 100 px-tall children, so the midpoints are 50, 150 and 250. */
const verticalDocument = () => build({ root: ['a', 'b', 'c'] }, { blocks: { root: 'page' } })

const verticalRects = rectsFrom({
  [id('root')]: rect(0, 0, 400, 300),
  [id('a')]: rect(0, 0, 400, 100),
  [id('b')]: rect(0, 100, 400, 100),
  [id('c')]: rect(0, 200, 400, 100),
})

const horizontalRects = rectsFrom({
  [id('root')]: rect(0, 0, 300, 100),
  [id('a')]: rect(0, 0, 100, 100),
  [id('b')]: rect(100, 0, 100, 100),
  [id('c')]: rect(200, 0, 100, 100),
})

type Overrides = Partial<ResolveDropTargetArgs>

const resolve = (overrides: Overrides = {}) =>
  resolveDropTarget({
    point: { x: 200, y: 10 },
    hitNodeId: id('root'),
    draggedBlockId: blockId('heading'),
    draggedNodeIds: [],
    document: verticalDocument(),
    registry,
    rects: verticalRects,
    isolationId: null,
    breakpoint: 'base',
    ...overrides,
  })

beforeEach(() => {
  resetFactories()
})

describe('a vertical list', () => {
  it.each([
    ['above the first child', 10, 0],
    ['above the second child’s midpoint', 140, 1],
    ['below the second child’s midpoint', 160, 2],
    ['below the last child', 290, 3],
  ])('puts a drop %s at index %i', (_, y, index) => {
    expect(resolve({ point: { x: 200, y } })?.index).toBe(index)
  })

  it('draws the line on the edge between the two siblings', () => {
    const target = resolve({ point: { x: 200, y: 160 } })

    expect(target?.indicator).toEqual({
      kind: 'line',
      axis: 'y',
      rect: { x: 0, y: 199, width: 400, height: 2 },
    })
  })

  it('reports the container and the slot it resolved into', () => {
    expect(resolve()).toMatchObject({
      parentId: id('root'),
      slot: 'children',
      orientation: 'vertical',
    })
  })
})

describe('a horizontal row', () => {
  const row = () => build({ root: ['a', 'b', 'c'] }, { blocks: { root: 'row' } })

  it.each([
    ['left of the first child', 10, 0],
    ['left of the second child’s midpoint', 140, 1],
    ['right of the second child’s midpoint', 160, 2],
    ['right of the last child', 290, 3],
  ])('puts a drop %s at index %i', (_, x, index) => {
    const target = resolve({ document: row(), rects: horizontalRects, point: { x, y: 50 } })

    expect(target?.index).toBe(index)
  })

  it('draws the line vertically', () => {
    const target = resolve({ document: row(), rects: horizontalRects, point: { x: 160, y: 50 } })

    expect(target?.indicator).toEqual({
      kind: 'line',
      axis: 'x',
      rect: { x: 199, y: 0, width: 2, height: 100 },
    })
  })
})

describe('a grid', () => {
  const grid = () => build({ root: ['a', 'b', 'c'] }, { blocks: { root: 'grid' } })
  const rects = rectsFrom({
    [id('root')]: rect(0, 0, 220, 220),
    [id('a')]: rect(0, 0, 100, 100),
    [id('b')]: rect(120, 0, 100, 100),
    [id('c')]: rect(0, 120, 100, 100),
  })

  it.each([
    ['the first cell', 20, 40, 0],
    ['the second cell', 160, 40, 1],
    ['the third cell, one row down', 20, 160, 2],
  ])('resolves a pointer in %s to index %i', (_, x, y, index) => {
    const target = resolve({ document: grid(), rects, point: { x, y } })

    expect(target).toMatchObject({ index, orientation: 'grid' })
    expect(target?.indicator.kind).toBe('cell')
  })

  it('treats the empty cell past the last child as a target of its own', () => {
    const target = resolve({ document: grid(), rects, point: { x: 160, y: 160 } })

    expect(target?.index).toBe(3)
    expect(target?.indicator).toEqual({
      kind: 'cell',
      rect: { x: 120, y: 120, width: 100, height: 100 },
    })
  })
})

describe('an empty container', () => {
  it('fills it, at index 0', () => {
    const target = resolve({
      document: build({ root: [] }, { blocks: { root: 'page' } }),
      rects: rectsFrom({ [id('root')]: rect(0, 0, 400, 200) }),
    })

    expect(target).toMatchObject({ index: 0, parentId: id('root') })
    expect(target?.indicator).toEqual({
      kind: 'fill',
      rect: { x: 0, y: 0, width: 400, height: 200 },
    })
  })
})

describe('the walk up the tree', () => {
  it('resolves into the child container the pointer is actually in', () => {
    const document = build(
      { root: ['inner'], inner: ['a'] },
      { blocks: { root: 'page', inner: 'page' } },
    )
    const rects = rectsFrom({
      [id('root')]: rect(0, 0, 400, 400),
      [id('inner')]: rect(0, 100, 400, 200),
      [id('a')]: rect(0, 100, 400, 100),
    })

    expect(
      resolve({ document, rects, hitNodeId: id('inner'), point: { x: 200, y: 280 } }),
    ).toMatchObject({ parentId: id('inner'), index: 1 })
  })

  it('walks past a parent whose slot refuses the block', () => {
    const document = build(
      { root: ['bar'], bar: ['x'] },
      { blocks: { root: 'page', bar: 'navbar', x: 'link' } },
    )
    const rects = rectsFrom({
      [id('root')]: rect(0, 0, 400, 400),
      [id('bar')]: rect(0, 0, 400, 60),
      [id('x')]: rect(0, 0, 100, 60),
    })

    // A heading is not a link, so the navbar cannot take it and the page above it can.
    expect(resolve({ document, rects, hitNodeId: id('bar') })).toMatchObject({
      parentId: id('root'),
      slot: 'children',
    })
  })

  it('lands on the child’s own slot when the parent has more than one', () => {
    const document = build(
      { root: ['side'], side: [] },
      { blocks: { root: 'columns', side: 'page' }, slots: { side: 'right' } },
    )
    const rects = rectsFrom({
      [id('root')]: rect(0, 0, 400, 200),
      [id('side')]: rect(200, 0, 200, 200),
    })

    expect(
      resolve({ document, rects, hitNodeId: id('side'), point: { x: 300, y: 100 } }),
    ).toMatchObject({ parentId: id('side'), slot: 'children' })
  })

  it('rejects on the root itself when nothing up the tree accepts the block', () => {
    const document = build({ root: ['x'] }, { blocks: { root: 'navbar', x: 'link' } })
    const rects = rectsFrom({ [id('root')]: rect(0, 0, 400, 60), [id('x')]: rect(0, 0, 100, 60) })
    const target = resolve({ document, rects, hitNodeId: id('x') })

    expect(target?.parentId).toBe(id('root'))
    expect(target?.indicator).toMatchObject({ kind: 'reject' })
  })

  it('has no answer at all for a block the registry does not know', () => {
    expect(resolve({ draggedBlockId: blockId('nonesuch') })).toBeNull()
  })

  it('starts from the container when the pointer is over nothing', () => {
    expect(resolve({ hitNodeId: null })).toMatchObject({ parentId: id('root') })
  })
})

describe('the layout axis', () => {
  const flex = (props: Record<string, unknown>, responsive = {}) =>
    build(
      { root: ['a', 'b', 'c'] },
      { blocks: { root: 'flex' }, props: { root: props }, responsive: { root: responsive } },
    )

  it('comes from the container’s own props', () => {
    const target = resolve({ document: flex({ direction: 'row' }), rects: horizontalRects })

    expect(target?.orientation).toBe('horizontal')
  })

  it('follows the breakpoint override, because that is the layout on screen', () => {
    const document = flex({ direction: 'column' }, { md: { direction: 'row' } })

    expect(resolve({ document, rects: horizontalRects, breakpoint: 'md' })?.orientation).toBe(
      'horizontal',
    )
    expect(resolve({ document, rects: horizontalRects, breakpoint: 'base' })?.orientation).toBe(
      'vertical',
    )
  })

  it('is vertical for a slot that declares nothing', () => {
    const document = build({ root: ['a'] }, { blocks: { root: 'plain' } })

    expect(resolve({ document })?.orientation).toBe('vertical')
  })
})

describe('a rejected drop', () => {
  const nested = () =>
    build(
      { root: ['parent'], parent: ['child'], child: ['grandchild'] },
      { blocks: { root: 'page', parent: 'page', child: 'page', grandchild: 'page' } },
    )
  const rects = rectsFrom({
    [id('root')]: rect(0, 0, 400, 400),
    [id('parent')]: rect(0, 0, 400, 300),
    [id('child')]: rect(0, 0, 400, 200),
    [id('grandchild')]: rect(0, 0, 400, 100),
  })

  it.each([['parent'], ['child'], ['grandchild']])(
    'refuses to move a node into %s, which is itself or below it',
    (into) => {
      const target = resolve({
        document: nested(),
        rects,
        hitNodeId: id(into),
        draggedNodeIds: [id('parent')],
      })

      expect(target?.indicator).toMatchObject({
        kind: 'reject',
        reason: 'Cannot drop into itself',
      })
    },
  )

  it('says a locked container is locked', () => {
    const document = build({ root: ['a'] }, { blocks: { root: 'page' }, locked: ['root'] })

    expect(resolve({ document })?.indicator).toMatchObject({ reason: 'Layer is locked' })
  })

  it('says a hidden container is hidden', () => {
    const document = build({ root: ['a'] }, { blocks: { root: 'page' }, hidden: ['root'] })

    expect(resolve({ document })?.indicator).toMatchObject({ reason: 'Layer is hidden' })
  })

  it('counts what a full slot holds, in the slot’s own words', () => {
    const document = build(
      { root: ['x', 'y'] },
      { blocks: { root: 'navbar', x: 'link', y: 'link' } },
    )
    const rects = rectsFrom({
      [id('root')]: rect(0, 0, 400, 60),
      [id('x')]: rect(0, 0, 100, 60),
      [id('y')]: rect(100, 0, 100, 60),
    })

    expect(
      resolve({ document, rects, draggedBlockId: blockId('link'), hitNodeId: id('root') })
        ?.indicator,
    ).toMatchObject({ reason: 'root accepts up to 2 links' })
  })

  it('names the category a slot does accept', () => {
    const document = build({ root: ['x'] }, { blocks: { root: 'navbar', x: 'link' } })
    const rects = rectsFrom({ [id('root')]: rect(0, 0, 400, 60), [id('x')]: rect(0, 0, 100, 60) })

    expect(resolve({ document, rects, hitNodeId: id('x') })?.indicator).toMatchObject({
      reason: 'root only accepts layout blocks',
    })
  })

  it('shows the rejection over the container, so the outline has something to draw', () => {
    const document = build({ root: ['a'] }, { blocks: { root: 'page' }, locked: ['root'] })
    const target = resolve({ document })

    expect(target?.indicator).toMatchObject({ rect: { x: 0, y: 0, width: 400, height: 300 } })
  })
})

describe('isolation', () => {
  const document = () =>
    build({ root: ['inner'], inner: ['a'] }, { blocks: { root: 'page', inner: 'page' } })
  const rects = rectsFrom({
    [id('root')]: rect(0, 0, 400, 400),
    [id('inner')]: rect(0, 100, 400, 200),
    [id('a')]: rect(0, 100, 400, 100),
  })

  it('keeps a drop inside the isolated container', () => {
    const target = resolve({
      document: document(),
      rects,
      hitNodeId: id('root'),
      isolationId: id('inner'),
    })

    expect(target?.parentId).toBe(id('inner'))
  })

  it('still resolves into a child of the isolated container', () => {
    const target = resolve({
      document: document(),
      rects,
      hitNodeId: id('a'),
      isolationId: id('inner'),
      point: { x: 200, y: 190 },
    })

    expect(target).toMatchObject({ parentId: id('inner'), index: 1 })
  })
})

describe('a node moving inside its own list', () => {
  it('counts the list without the node that is leaving it', () => {
    // a b c, dragging `a` down past b's midpoint: the list `moveNodes` splices into is [b, c], so the
    // position after b is 1 — not 2, which is where counting the dragged node too would land it.
    const target = resolve({
      point: { x: 200, y: 160 },
      draggedNodeIds: [id('a')],
      draggedBlockId: blockId('heading'),
    })

    expect(target?.index).toBe(1)
  })

  it('is index 0 when it goes back to the top', () => {
    expect(resolve({ point: { x: 200, y: 10 }, draggedNodeIds: [id('a')] })?.index).toBe(0)
  })

  it('is the end of the shortened list when it goes to the bottom', () => {
    expect(resolve({ point: { x: 200, y: 290 }, draggedNodeIds: [id('a')] })?.index).toBe(2)
  })

  it('leaves room for the node that is leaving a full slot', () => {
    const document = build(
      { root: ['x', 'y'] },
      { blocks: { root: 'navbar', x: 'link', y: 'link' } },
    )
    const rects = rectsFrom({
      [id('root')]: rect(0, 0, 400, 60),
      [id('x')]: rect(0, 0, 100, 60),
      [id('y')]: rect(100, 0, 100, 60),
    })
    const target = resolve({
      document,
      rects,
      hitNodeId: id('root'),
      draggedBlockId: blockId('link'),
      draggedNodeIds: [id('x')],
    })

    expect(target?.indicator.kind).not.toBe('reject')
  })
})

describe('an unmeasured child', () => {
  it('is left out of the comparison rather than compared against nothing', () => {
    const rects = rectsFrom({
      [id('root')]: rect(0, 0, 400, 300),
      [id('a')]: rect(0, 0, 400, 100),
      [id('c')]: rect(0, 200, 400, 100),
    })

    expect(resolve({ rects, point: { x: 200, y: 160 } })?.index).toBe(1)
  })
})

describe('what the resolver cannot answer', () => {
  it('has no target when the container’s own block is not in the registry', () => {
    const document = build({ root: ['a'] }, { blocks: { root: 'mystery' } })

    expect(resolve({ document })).toBeNull()
  })

  it('places a rejection over nothing when the container was never measured', () => {
    const document = build({ root: ['a'] }, { blocks: { root: 'page' }, locked: ['root'] })
    const target = resolve({ document, rects: rectsFrom({}) })

    expect(target?.indicator).toEqual({
      kind: 'reject',
      reason: 'Layer is locked',
      rect: { x: 0, y: 0, width: 0, height: 0 },
    })
  })

  it('fills nothing when an empty container was never measured', () => {
    const document = build({ root: [] }, { blocks: { root: 'page' } })
    const target = resolve({ document, rects: rectsFrom({}) })

    expect(target?.indicator).toEqual({
      kind: 'fill',
      rect: { x: 0, y: 0, width: 0, height: 0 },
    })
  })

  it('ignores a hit on a node that no longer exists', () => {
    expect(resolve({ hitNodeId: nodeId('node_ghost') })).toMatchObject({ parentId: id('root') })
  })
})
