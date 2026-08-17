import { blockRegistry } from '@motion-studio/blocks/registry'
import { type MotionDocument, type NodeId, blockId, doc, node, nodeId } from '@motion-studio/schema'
import { ToastProvider } from '@motion-studio/ui'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useStudioStore } from '../../../../store/editor-store'
import { setCanvasHandle } from '../../canvas-area/canvas-handle'

import { insertBlockAtSelection, useInsertBlock } from './use-insert-block'

const state = () => useStudioStore.getState()
const id = (name: string): NodeId => nodeId(`node_${name}`)

const SECTION = blockRegistry.require(blockId('section'))
const HEADING = blockRegistry.require(blockId('heading'))

/** `root ▸ (outer ▸ inner, tail)` — enough for the three branches the resolver walks. */
const document_ = (locked = false): MotionDocument =>
  doc([
    node({
      id: id('root'),
      blockId: blockId('section'),
      name: 'Page',
      slot: 'root',
      children: [id('outer'), id('tail')],
      locked,
    }),
    node({
      id: id('outer'),
      blockId: blockId('section'),
      name: 'Outer',
      parentId: id('root'),
      slot: 'children',
      children: [id('inner')],
    }),
    node({
      id: id('inner'),
      blockId: blockId('heading'),
      name: 'Inner',
      parentId: id('outer'),
      slot: 'children',
    }),
    node({
      id: id('tail'),
      blockId: blockId('heading'),
      name: 'Tail',
      parentId: id('root'),
      slot: 'children',
    }),
  ])

const load = (locked = false): void => {
  act(() => {
    state().replaceDocument(document_(locked))
    state().clearSelection()
    // Isolation survives a document whose nodes have the same ids, and the store is shared per file.
    state().exitNode()
  })
}

const inserted = (outcome: ReturnType<typeof insertBlockAtSelection>): NodeId => {
  if ('rejected' in outcome) {
    throw new Error(`expected an insert, got: ${outcome.rejected}`)
  }

  return outcome.inserted
}

beforeEach(() => load())

afterEach(() => {
  setCanvasHandle(null)
})

describe('insertBlockAtSelection', () => {
  it('lands at the end of the root when nothing is selected', () => {
    const id_ = inserted(insertBlockAtSelection(HEADING))

    expect(state().document.nodes[id('root')]?.children.at(-1)).toBe(id_)
    expect(state().document.nodes[id_]?.slot).toBe('children')
  })

  it('lands beside the selection, in the selection’s parent', () => {
    act(() => state().select([id('inner')], 'replace'))

    const id_ = inserted(insertBlockAtSelection(HEADING))

    expect(state().document.nodes[id_]?.parentId).toBe(id('outer'))
    expect(state().document.nodes[id('outer')]?.children).toEqual([id('inner'), id_])
  })

  it('lands inside the isolated container, whatever is selected', () => {
    act(() => {
      state().select([id('tail')], 'replace')
      state().enterNode(id('outer'))
    })

    const id_ = inserted(insertBlockAtSelection(HEADING))

    expect(state().document.nodes[id_]?.parentId).toBe(id('outer'))
  })

  it('selects what it inserted', () => {
    const id_ = inserted(insertBlockAtSelection(HEADING))

    expect(state().selection.ids).toEqual([id_])
  })

  it('reports the reason rather than inserting when nothing accepts the block', () => {
    load(true)

    const outcome = insertBlockAtSelection(SECTION)
    const nodes = Object.keys(state().document.nodes).length

    expect(outcome).toEqual({ rejected: 'Nothing here accepts Section' })
    expect(Object.keys(state().document.nodes)).toHaveLength(nodes)
  })
})

function Harness() {
  const insert = useInsertBlock()

  return (
    <button onClick={() => insert(SECTION)} type="button">
      Insert
    </button>
  )
}

const harness = () =>
  render(
    <ToastProvider>
      <Harness />
    </ToastProvider>,
  )

describe('useInsertBlock', () => {
  it('reveals the new node on the canvas', async () => {
    const reveal = vi.fn().mockReturnValue(true)

    setCanvasHandle({
      documentRect: () => ({ x: 0, y: 0, width: 0, height: 0 }) as never,
      viewportRect: () => ({ left: 0, top: 0, width: 0, height: 0 }),
      transform: () => ({ zoom: 1, pan: { x: 0, y: 0 } }),
      fitDocument: () => undefined,
      nodeRect: () => undefined,
      panBy: () => undefined,
      remeasure: () => undefined,
      reveal,
    })

    harness()
    await userEvent.click(screen.getByRole('button', { name: 'Insert' }))

    expect(reveal).toHaveBeenCalledWith(state().selection.ids[0])
  })

  it('says why in a toast when the target rejects the block', async () => {
    load(true)
    harness()

    await userEvent.click(screen.getByRole('button', { name: 'Insert' }))

    expect(await screen.findByText('Cannot add Section')).toBeInTheDocument()
    expect(screen.getByText('Nothing here accepts Section')).toBeInTheDocument()
  })
})
