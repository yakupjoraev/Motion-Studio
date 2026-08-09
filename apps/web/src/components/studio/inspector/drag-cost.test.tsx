import { commands } from '@motion-studio/editor'
import {
  type ControlDescriptor,
  type NodeId,
  blockId,
  createEmptyDocument,
  nodeId,
} from '@motion-studio/schema'
import { act, render, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useStudioStore } from '../../../store/editor-store'
import { CanvasHost } from '../canvas-area/canvas-host'

import { useControlCommit } from './use-control-commit'

let counter = 0

const nextId = (): NodeId => {
  counter += 1

  return nodeId(`node_d${counter}`)
}

const state = () => useStudioStore.getState()

const canvasRenders = (): number =>
  (window as unknown as { __canvasRenders?: number }).__canvasRenders ?? 0

const insert = (block: string): NodeId => {
  const id = nextId()

  act(() => {
    state().dispatch(
      commands.insertBlock({
        blockId: blockId(block),
        parentId: state().document.rootId,
        index: 0,
        slot: 'children',
        id,
      }),
    )
  })

  return id
}

const LEVEL: ControlDescriptor = { path: 'level', kind: 'number', label: 'Level' }

beforeEach(() => {
  vi.useFakeTimers()

  act(() => {
    state().replaceDocument(createEmptyDocument({ ids: () => nextId() }))
    state().clearSelection()
    state().setBreakpoint('base')
  })
})

afterEach(() => {
  vi.useRealTimers()
})

/**
 * The number the prompt asks for, as a test rather than as a note: an inspector drag must not cost
 * the canvas a render. It holds because nothing in the host subscribes to the document — the rect
 * cache hears about a change through the scene's own subscription (ADR-112).
 */
describe('the cost of a drag', () => {
  it('renders the canvas zero times while a control is dragged, and records one history entry', () => {
    const heading = insert('heading')

    act(() => state().select([heading]))
    render(<CanvasHost />)

    const { result } = renderHook(() => useControlCommit(LEVEL, [heading]))
    const rendersBefore = canvasRenders()
    const historyBefore = state().history.past.length

    act(() => {
      for (let step = 0; step < 200; step += 1) {
        result.current.onChange((step % 6) + 1)
        vi.advanceTimersByTime(16)
      }

      result.current.onCommit(4)
    })

    expect(canvasRenders() - rendersBefore).toBe(0)
    expect(state().history.past.length - historyBefore).toBe(1)
    expect(state().document.nodes[heading]?.props['level']).toBe(4)
  })

  it('still renders the canvas when the thing that changed is the canvas', () => {
    render(<CanvasHost />)

    const before = canvasRenders()

    act(() => state().setBreakpoint('lg'))

    expect(canvasRenders() - before).toBeGreaterThan(0)
  })
})
