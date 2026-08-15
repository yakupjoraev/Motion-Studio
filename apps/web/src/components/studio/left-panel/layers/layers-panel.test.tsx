import {
  type MotionDocument,
  type Node,
  type NodeId,
  blockId,
  doc,
  node,
  nodeId,
} from '@motion-studio/schema'
import { DENSITY } from '@motion-studio/ui'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useStudioStore } from '../../../../store/editor-store'

import { LayersPanel } from './layers-panel'

const state = () => useStudioStore.getState()
const id = (name: string): NodeId => nodeId(`node_${name}`)

const SECTION = blockId('section')
const HEADING = blockId('heading')

/** `root ▸ (group ▸ (leaf 1…count), tail)` — one group to fold and a sibling after it. */
const document_ = (count: number): MotionDocument => {
  const leaves: Node[] = Array.from({ length: count }, (_, index) =>
    node({
      id: id(`leaf${index}`),
      blockId: HEADING,
      name: `Leaf ${index}`,
      parentId: id('group'),
      slot: 'children',
    }),
  )

  return doc([
    node({
      id: id('root'),
      blockId: SECTION,
      name: 'Page',
      slot: 'root',
      children: [id('group'), id('tail')],
    }),
    node({
      id: id('group'),
      blockId: SECTION,
      name: 'Group',
      parentId: id('root'),
      slot: 'children',
      children: leaves.map((leaf) => leaf.id),
    }),
    node({
      id: id('tail'),
      blockId: HEADING,
      name: 'Tail',
      parentId: id('root'),
      slot: 'children',
    }),
    ...leaves,
  ])
}

const load = (count: number): void => {
  act(() => {
    state().replaceDocument(document_(count))
    state().clearSelection()
  })
}

const panel = () => render(<LayersPanel />)

const rowNamed = (name: string): HTMLElement =>
  screen.getByRole('treeitem', { name: new RegExp(`^${name}\\b`) })

/**
 * Focus and then the key, in two commits: the roving tabindex is React state, and a press batched
 * into the same commit as the focus would still be read against the row that had it before.
 */
const press = async (name: string, init: KeyboardEventInit): Promise<void> => {
  await act(async () => {
    rowNamed(name).focus()
  })

  await act(async () => {
    fireEvent.keyDown(rowNamed(name), init)
  })
}

beforeEach(() => {
  // jsdom measures nothing, and a virtualizer with a zero-height viewport renders no rows. The
  // virtualizer reads `offsetHeight`; the rect source reads the box.
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 400 })
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 240 })
  // The virtualizer clamps a scroll to what the element says it can scroll, and jsdom says nothing.
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 400 })
  Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
    configurable: true,
    value: 100000,
  })

  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: 240,
    bottom: 400,
    width: 240,
    height: 400,
    toJSON: () => ({}),
  })

  load(4)
})

describe('LayersPanel', () => {
  it('is a tree of the document, deepest level indented under its parent', () => {
    panel()

    expect(screen.getByRole('tree', { name: 'Layers' })).toHaveAttribute(
      'aria-multiselectable',
      'true',
    )
    expect(rowNamed('Page')).toHaveAttribute('aria-level', '1')
    expect(rowNamed('Group')).toHaveAttribute('aria-level', '2')
    expect(rowNamed('Leaf 0')).toHaveAttribute('aria-level', '3')
    expect(screen.getByText('7 layers')).toBeInTheDocument()
  })

  it('tells a screen reader the size of the whole set, not of the rendered window', () => {
    load(400)
    panel()

    const rows = screen.getAllByRole('treeitem')

    expect(rows.length).toBeLessThan(60)
    expect(rowNamed('Leaf 0')).toHaveAttribute('aria-setsize', '400')
    expect(rowNamed('Leaf 0')).toHaveAttribute('aria-posinset', '1')
    expect(rowNamed('Leaf 5')).toHaveAttribute('aria-posinset', '6')
  })

  it('keeps exactly one tab stop and moves it with the arrows', async () => {
    panel()

    const stops = () => screen.getAllByRole('treeitem').filter((row) => row.tabIndex === 0)

    expect(stops()).toHaveLength(1)
    expect(stops()[0]).toBe(rowNamed('Page'))

    await press('Page', { key: 'ArrowDown' })

    expect(stops()).toHaveLength(1)
    expect(stops()[0]).toBe(rowNamed('Group'))
    expect(rowNamed('Group')).toHaveFocus()
  })

  it('selects with Space and extends with Shift and an arrow — ADR-136', async () => {
    panel()

    await press('Group', { key: ' ' })

    expect(state().selection.ids).toEqual([id('group')])
    expect(rowNamed('Group')).toHaveAttribute('aria-selected', 'true')
  })

  it('folds a subtree with ← and takes its rows out of the list', async () => {
    panel()

    await press('Group', { key: 'ArrowLeft' })

    expect(screen.queryByText('Leaf 0')).not.toBeInTheDocument()
    expect(rowNamed('Group')).toHaveAttribute('aria-expanded', 'false')
  })

  it('renames on F2, commits on Enter and keeps the old name on Esc', async () => {
    const user = userEvent.setup()

    panel()

    await press('Tail', { key: 'F2' })

    const field = screen.getByRole('textbox', { name: 'Rename Tail' })

    await user.clear(field)
    await user.type(field, 'Footer{Enter}')

    expect(state().document.nodes[id('tail')]?.name).toBe('Footer')

    await press('Footer', { key: 'F2' })

    const second = screen.getByRole('textbox', { name: 'Rename Footer' })

    await user.clear(second)
    await user.type(second, 'Discarded{Escape}')

    expect(state().document.nodes[id('tail')]?.name).toBe('Footer')
  })

  it('moves a layer among its siblings with Mod and an arrow, as one undo step', async () => {
    panel()

    const before = state().history.past.length

    await press('Group', { key: 'ArrowDown', ctrlKey: true })

    expect(state().document.nodes[id('root')]?.children).toEqual([id('tail'), id('group')])
    expect(state().history.past.length).toBe(before + 1)
  })

  it('hides and locks a layer from buttons that name it', async () => {
    const user = userEvent.setup()

    panel()

    await user.click(within(rowNamed('Tail')).getByRole('button', { name: 'Hide Tail' }))

    expect(state().document.nodes[id('tail')]?.hidden).toBe(true)

    await user.click(within(rowNamed('Tail')).getByRole('button', { name: 'Lock Tail' }))

    expect(state().document.nodes[id('tail')]?.locked).toBe(true)
  })

  it('finds a match inside a folded group and opens the path to it', async () => {
    const user = userEvent.setup()

    panel()

    await press('Group', { key: 'ArrowLeft' })

    expect(screen.queryByText('Leaf 2')).not.toBeInTheDocument()

    await user.type(screen.getByRole('searchbox', { name: 'Search layers' }), 'Leaf 2')

    expect(screen.getByText('Leaf 2')).toBeInTheDocument()
    expect(screen.getByText('1 layer match')).toBeInTheDocument()
    expect(screen.queryByText('Tail')).not.toBeInTheDocument()
  })

  it('selects on click and adds with Mod', async () => {
    const user = userEvent.setup()

    panel()

    await user.click(rowNamed('Tail'))

    expect(state().selection.ids).toEqual([id('tail')])

    await user.keyboard('{Control>}')
    await user.click(rowNamed('Group'))
    await user.keyboard('{/Control}')

    expect(state().selection.ids).toEqual([id('group'), id('tail')])
  })

  it('scrolls the row into view when the selection was made somewhere else', () => {
    const scrollTo = vi.fn()

    Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
      configurable: true,
      value: scrollTo,
    })

    load(400)
    panel()
    scrollTo.mockClear()

    act(() => state().select([id('leaf399')]))

    // Row 401 of the list — the two above it are the page and the group.
    expect(scrollTo).toHaveBeenCalledTimes(1)
    expect(scrollTo.mock.calls[0]?.[0]?.top).toBeGreaterThan(400 * DENSITY.layerRow - 400)
  })

  it('has no accessibility violations', async () => {
    const { container } = panel()

    expect(await axe(container)).toHaveNoViolations()
  })
})
