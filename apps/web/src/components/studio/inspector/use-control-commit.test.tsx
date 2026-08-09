import { commands } from '@motion-studio/editor'
import {
  type ControlDescriptor,
  type NodeId,
  blockId,
  createEmptyDocument,
  nodeId,
} from '@motion-studio/schema'
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useStudioStore } from '../../../store/editor-store'

import { PREVIEW_INTERVAL_MS, useControlCommit } from './use-control-commit'

let counter = 0

const nextId = (): NodeId => {
  counter += 1

  return nodeId(`node_c${counter}`)
}

const state = () => useStudioStore.getState()
const root = (): NodeId => state().document.rootId

const insert = (block: string): NodeId => {
  const id = nextId()

  act(() => {
    state().dispatch(
      commands.insertBlock({
        blockId: blockId(block),
        parentId: root(),
        index: 0,
        slot: 'children',
        id,
      }),
    )
  })

  return id
}

const descriptor = (over: Partial<ControlDescriptor> = {}): ControlDescriptor => ({
  path: 'level',
  kind: 'number',
  label: 'Level',
  ...over,
})

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

describe('useControlCommit', () => {
  it('turns a 200-frame drag into one history entry', () => {
    const heading = insert('heading')
    const { result } = renderHook(() => useControlCommit(descriptor(), [heading]))
    const before = state().history.past.length

    // A 200 px scrub at one value per frame. No block in this build declares a `cssVar`, so every
    // one of these takes the throttled path — ADR-111.
    act(() => {
      for (let step = 0; step < 200; step += 1) {
        result.current.onChange((step % 6) + 1)
        vi.advanceTimersByTime(16)
      }

      result.current.onCommit(3)
    })

    expect(state().document.nodes[heading]?.props['level']).toBe(3)
    expect(state().history.past.length - before).toBe(1)
  })

  it('leaves one undo step to return to the value before the drag', () => {
    const heading = insert('heading')
    const { result } = renderHook(() => useControlCommit(descriptor(), [heading]))

    act(() => {
      for (let step = 0; step < 60; step += 1) {
        result.current.onChange(5)
        vi.advanceTimersByTime(16)
      }

      result.current.onCommit(5)
    })

    act(() => state().undo())

    expect(state().document.nodes[heading]?.props['level']).toBe(2)
  })

  it('writes no more often than the preview interval', () => {
    const heading = insert('heading')
    const { result } = renderHook(() => useControlCommit(descriptor(), [heading]))
    const before = state().version

    act(() => {
      for (let step = 0; step < 10; step += 1) {
        result.current.onChange(4)
        vi.advanceTimersByTime(1)
      }
    })

    // Ten values inside one interval are one write, and the last value is the one that lands.
    expect(state().version).toBe(before)

    act(() => {
      vi.advanceTimersByTime(PREVIEW_INTERVAL_MS)
    })

    expect(state().version).toBe(before + 1)
  })

  it('writes a variable and nothing else when the block reads one — the fast path', () => {
    const heading = insert('heading')
    const element = document.createElement('div')

    element.setAttribute('data-node-id', heading)
    document.body.append(element)

    const { result } = renderHook(() =>
      useControlCommit(descriptor({ options: { cssVar: '--ms-opacity' } }), [heading]),
    )
    const before = state().version

    act(() => {
      result.current.onChange(0.5)
      vi.advanceTimersByTime(200)
    })

    expect(element.style.getPropertyValue('--ms-opacity')).toBe('0.5')
    expect(state().version).toBe(before)

    element.remove()
  })

  it('edits a multi-selection as one entry', () => {
    const first = insert('heading')
    const second = insert('heading')
    const { result } = renderHook(() =>
      useControlCommit(descriptor({ path: 'text', kind: 'text', label: 'Text' }), [first, second]),
    )
    const before = state().history.past.length

    act(() => {
      result.current.onCommit('Shared')
    })

    expect(state().document.nodes[first]?.props['text']).toBe('Shared')
    expect(state().document.nodes[second]?.props['text']).toBe('Shared')
    expect(state().history.past.length - before).toBe(1)
  })

  it('resets to the block’s own default at base', () => {
    const heading = insert('heading')
    const { result } = renderHook(() => useControlCommit(descriptor(), [heading]))

    act(() => result.current.onCommit(6))

    expect(state().document.nodes[heading]?.props['level']).toBe(6)

    act(() => result.current.onReset())

    expect(state().document.nodes[heading]?.props['level']).toBe(2)
  })

  it('removes the override rather than the prop away from base', () => {
    const heading = insert('heading')

    act(() => state().setBreakpoint('lg'))

    const { result } = renderHook(() => useControlCommit(descriptor(), [heading]))

    act(() => result.current.onCommit(4))

    expect(state().document.nodes[heading]?.responsive['lg']).toEqual({ level: 4 })

    act(() => result.current.onReset())

    expect(state().document.nodes[heading]?.responsive['lg']).toBeUndefined()
    expect(state().document.nodes[heading]?.props['level']).toBe(2)
  })
})
