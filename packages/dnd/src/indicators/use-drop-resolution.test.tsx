import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { DropTarget } from '../dnd.types'
import { createIndicatorHandle } from './indicator-handle'
import { RESOLVE_SKIP_PX, useDropResolution } from './use-drop-resolution'

const target = (y: number): DropTarget => ({
  parentId: 'node_root' as DropTarget['parentId'],
  slot: 'children',
  index: 0,
  orientation: 'vertical',
  indicator: { kind: 'line', axis: 'y', rect: { x: 0, y, width: 10, height: 2 } },
})

/** Frames are driven by hand, so "one resolution per frame" is a fact the test can state. */
function setup(resolve: () => DropTarget | null) {
  const frames: (() => void)[] = []
  const handle = createIndicatorHandle()
  const view = renderHook(() =>
    useDropResolution({
      indicator: handle,
      resolve,
      schedule: (callback) => {
        frames.push(callback)

        return frames.length
      },
      cancel: () => {},
    }),
  )

  const run = (): void => {
    for (const frame of frames.splice(0)) {
      frame()
    }
  }

  return { handle, frames, view, run }
}

describe('useDropResolution', () => {
  it('resolves the first move of a drag whatever its size', () => {
    const resolve = vi.fn(() => target(10))
    const { frames, view, run } = setup(resolve)

    view.result.current.request({ x: 0, y: 0 })
    expect(frames).toHaveLength(1)

    run()
    expect(resolve).toHaveBeenCalledTimes(1)
  })

  it(`skips a move under ${RESOLVE_SKIP_PX} px`, () => {
    const resolve = vi.fn(() => target(10))
    const { view, run } = setup(resolve)

    view.result.current.request({ x: 100, y: 100 })
    run()
    view.result.current.request({ x: 101, y: 101 })
    run()

    expect(resolve).toHaveBeenCalledTimes(1)
  })

  it('resolves again once the pointer has actually travelled', () => {
    const resolve = vi.fn(() => target(10))
    const { view, run } = setup(resolve)

    view.result.current.request({ x: 100, y: 100 })
    run()
    view.result.current.request({ x: 100, y: 104 })
    run()

    expect(resolve).toHaveBeenCalledTimes(2)
  })

  it('coalesces two moves inside one frame into one resolution', () => {
    const resolve = vi.fn(() => target(10))
    const { frames, view, run } = setup(resolve)

    view.result.current.request({ x: 0, y: 0 })
    view.result.current.request({ x: 0, y: 40 })
    view.result.current.request({ x: 0, y: 80 })

    expect(frames).toHaveLength(1)

    run()
    expect(resolve).toHaveBeenCalledTimes(1)
  })

  it('moves the indicator it resolved', () => {
    const { handle, view, run } = setup(() => target(64))

    view.result.current.request({ x: 0, y: 0 })
    run()

    expect(handle.kind()).toBe('line')
    expect(handle.rect()).toEqual({ x: 0, y: 64, width: 10, height: 2 })
  })

  it('clears the indicator when the drag stops', () => {
    const { handle, view, run } = setup(() => target(64))

    view.result.current.request({ x: 0, y: 0 })
    run()
    view.result.current.stop()

    expect(handle.kind()).toBe('none')
  })

  it('resolves the first move after a stop, however small', () => {
    const resolve = vi.fn(() => target(10))
    const { view, run } = setup(resolve)

    view.result.current.request({ x: 50, y: 50 })
    run()
    view.result.current.stop()
    view.result.current.request({ x: 50, y: 50 })
    run()

    expect(resolve).toHaveBeenCalledTimes(2)
  })

  it('ignores a move with no point behind it', () => {
    const resolve = vi.fn(() => target(10))
    const { frames, view } = setup(resolve)

    view.result.current.request(null)

    expect(frames).toHaveLength(0)
  })

  it('clears a pending frame when it unmounts', () => {
    const cancel = vi.fn()
    const handle = createIndicatorHandle()
    const view = renderHook(() =>
      useDropResolution({
        indicator: handle,
        resolve: () => target(10),
        schedule: () => 7,
        cancel,
      }),
    )

    view.result.current.request({ x: 0, y: 0 })
    view.unmount()

    expect(cancel).toHaveBeenCalledWith(7)
  })
})
