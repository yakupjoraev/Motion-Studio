import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useStudioStore } from '../../../store/editor-store'

import { COALESCE_MS, useSelectedCode } from './use-selected-code'

const copyEntry = vi.fn()

vi.mock('../export/run-export', () => ({
  copyEntry: (...args: readonly unknown[]) => copyEntry(...args),
}))

const file = { path: 'Hero.tsx', contents: 'export function Hero() {}' }

const selectFirstNode = (): string => {
  const state = useStudioStore.getState()
  const id = state.document.rootId

  act(() => state.select([id]))

  return id
}

afterEach(() => {
  copyEntry.mockReset()
  vi.useRealTimers()
})

describe('the selected block’s code', () => {
  it('prints nothing until the panel is open', () => {
    copyEntry.mockResolvedValue(file)
    selectFirstNode()

    const { result } = renderHook(() => useSelectedCode(false))

    expect(result.current.status).toBe('empty')
    expect(copyEntry).not.toHaveBeenCalled()
  })

  it('prints the selection with the pipeline Copy React uses', async () => {
    copyEntry.mockResolvedValue(file)
    const id = selectFirstNode()

    const { result } = renderHook(() => useSelectedCode(true))

    await waitFor(() => expect(result.current.status).toBe('ready'))

    expect(result.current.file).toEqual(file)
    expect(copyEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({ scope: 'selection' }),
        selection: id,
      }),
    )
  })

  it('coalesces a burst of edits into one print', async () => {
    vi.useFakeTimers()
    copyEntry.mockResolvedValue(file)
    selectFirstNode()

    const { rerender } = renderHook(() => useSelectedCode(true))

    // A slider drag dispatches a command per frame. Nothing may reach the printer while it moves.
    for (let step = 0; step < 5; step += 1) {
      act(() => {
        useStudioStore.setState({ version: useStudioStore.getState().version + 1 })
      })
      rerender()
      act(() => void vi.advanceTimersByTime(COALESCE_MS / 5))
    }

    expect(copyEntry).not.toHaveBeenCalled()

    await act(async () => {
      vi.advanceTimersByTime(COALESCE_MS)
      await Promise.resolve()
    })

    expect(copyEntry).toHaveBeenCalledTimes(1)
  })

  it('reports a failure instead of showing the last good code', async () => {
    copyEntry.mockRejectedValue(new Error('no printer for this block'))
    selectFirstNode()
    // A fresh version, because the cache is keyed by it and an earlier test in this file has
    // already filled the entry this selection would otherwise hit.
    act(() => {
      useStudioStore.setState({ version: useStudioStore.getState().version + 100 })
    })

    const { result } = renderHook(() => useSelectedCode(true))

    await waitFor(() => expect(result.current.status).toBe('failed'))

    expect(result.current.error).toBe('no printer for this block')
    expect(result.current.file).toBeNull()
  })
})
