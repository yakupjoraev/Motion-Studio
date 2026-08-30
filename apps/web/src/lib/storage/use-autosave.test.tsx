import { commands } from '@motion-studio/editor'
import { ToastProvider } from '@motion-studio/ui'
import { act, render, renderHook, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useStudioStore } from '../../store/editor-store'

const mocks = vi.hoisted(() => ({
  saveDocument: vi.fn(async () => undefined),
  takeSnapshot: vi.fn(async () => undefined),
  downloadDocument: vi.fn(),
}))

vi.mock('./document-store', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./document-store')>()),
  saveDocument: mocks.saveDocument,
  takeSnapshot: mocks.takeSnapshot,
}))

vi.mock('../documents/download', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../documents/download')>()),
  downloadDocument: mocks.downloadDocument,
}))

const { AUTOSAVE_DEBOUNCE_MS, SNAPSHOT_PATCH_THRESHOLD, useAutosave } = await import(
  './use-autosave'
)
const { PENDING_KEY } = await import('./pending-write')

const wrapper = ({ children }: { children: ReactNode }) => <ToastProvider>{children}</ToastProvider>

const rename = (name: string): void => {
  act(() => {
    useStudioStore.getState().dispatch(commands.setDocumentMeta({ path: 'name', value: name }))
  })
}

/** Two paths, so consecutive edits land in two history entries rather than coalescing into one. */
const edit = (index: number): void => {
  act(() => {
    useStudioStore
      .getState()
      .dispatch(
        index % 2 === 0
          ? commands.setDocumentMeta({ path: 'canvas.width', value: 1000 + index })
          : commands.setDocumentMeta({ path: 'name', value: `Edit ${index}` }),
      )
  })
}

const settle = async (): Promise<void> => {
  await act(async () => {
    vi.advanceTimersByTime(AUTOSAVE_DEBOUNCE_MS)
    // The write is two awaits deep — `saveDocument`, then `takeSnapshot`.
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
  })
}

beforeEach(() => {
  vi.useFakeTimers()
  window.localStorage.clear()
  mocks.saveDocument.mockClear().mockResolvedValue(undefined)
  mocks.takeSnapshot.mockClear()
  mocks.downloadDocument.mockClear()
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('useAutosave', () => {
  it('waits for the debounce before writing', async () => {
    renderHook(() => useAutosave(), { wrapper })

    rename('One')

    act(() => {
      vi.advanceTimersByTime(AUTOSAVE_DEBOUNCE_MS - 1)
    })

    expect(mocks.saveDocument).not.toHaveBeenCalled()

    await settle()

    expect(mocks.saveDocument).toHaveBeenCalledTimes(1)
  })

  it('collapses a burst of changes into one write', async () => {
    renderHook(() => useAutosave(), { wrapper })

    rename('One')
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    rename('Two')

    await settle()

    expect(mocks.saveDocument).toHaveBeenCalledTimes(1)
  })

  it('flushes when the tab is hidden', async () => {
    renderHook(() => useAutosave(), { wrapper })

    rename('Hidden')

    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')

    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'))
      await Promise.resolve()
    })

    expect(mocks.saveDocument).toHaveBeenCalledTimes(1)
  })

  it('writes the fallback lane on unload', () => {
    renderHook(() => useAutosave(), { wrapper })

    rename('Unloaded')
    window.dispatchEvent(new Event('beforeunload'))

    expect(window.localStorage.getItem(PENDING_KEY)).toContain('"name": "Unloaded"')
  })

  it('does not write the lane when nothing is unsaved', async () => {
    renderHook(() => useAutosave(), { wrapper })

    rename('Saved')
    await settle()
    window.dispatchEvent(new Event('beforeunload'))

    expect(window.localStorage.getItem(PENDING_KEY)).toBeNull()
  })

  it('writes nothing at all when disabled', async () => {
    renderHook(() => useAutosave({ enabled: false }), { wrapper })

    rename('Fixture')
    await settle()
    window.dispatchEvent(new Event('beforeunload'))

    expect(mocks.saveDocument).not.toHaveBeenCalled()
    expect(window.localStorage.getItem(PENDING_KEY)).toBeNull()
  })
})

describe('a failed write', () => {
  const Host = () => {
    useAutosave()

    return null
  }

  const failWith = (error: unknown): void => {
    mocks.saveDocument.mockRejectedValue(error)
  }

  it('raises a toast that does not dismiss itself, with a working download', async () => {
    failWith(new DOMException('full', 'QuotaExceededError'))

    render(
      <ToastProvider duration={100}>
        <Host />
      </ToastProvider>,
    )

    rename('Doomed')
    await settle()

    expect(screen.getByText('Could not save')).toBeInTheDocument()

    // Long past the provider's own dismissal time: the toast is still there.
    act(() => {
      vi.advanceTimersByTime(10_000)
    })

    expect(screen.getByText('Could not save')).toBeInTheDocument()

    act(() => {
      screen.getByRole('button', { name: 'Download document' }).click()
    })

    expect(mocks.downloadDocument).toHaveBeenCalledTimes(1)
  })

  it('raises one toast, not one every two seconds', async () => {
    failWith(new DOMException('full', 'QuotaExceededError'))

    render(
      <ToastProvider>
        <Host />
      </ToastProvider>,
    )

    rename('One')
    await settle()
    rename('Two')
    await settle()

    expect(screen.getAllByText('Could not save')).toHaveLength(1)
  })
})

describe('snapshots', () => {
  it('takes one on the first write, as a baseline', async () => {
    renderHook(() => useAutosave(), { wrapper })

    rename('First')
    await settle()

    expect(mocks.takeSnapshot).toHaveBeenCalledTimes(1)
  })

  it('does not take one on every autosave', async () => {
    renderHook(() => useAutosave(), { wrapper })

    rename('First')
    await settle()
    rename('Second')
    await settle()

    expect(mocks.takeSnapshot).toHaveBeenCalledTimes(1)
  })

  it('takes one once the patch threshold is passed', async () => {
    renderHook(() => useAutosave(), { wrapper })

    rename('First')
    await settle()

    // Alternating paths, because `setDocumentMeta` coalesces by path: twenty renames inside the
    // window are one history entry of one patch, which is the case the counter is written for.
    for (let index = 0; index < SNAPSHOT_PATCH_THRESHOLD; index += 1) {
      edit(index)
    }

    await settle()

    expect(mocks.takeSnapshot).toHaveBeenCalledTimes(2)
  })

  it('does not take one just below the threshold', async () => {
    renderHook(() => useAutosave(), { wrapper })

    rename('First')
    await settle()

    for (let index = 0; index < SNAPSHOT_PATCH_THRESHOLD - 1; index += 1) {
      edit(index)
    }

    await settle()

    expect(mocks.takeSnapshot).toHaveBeenCalledTimes(1)
  })
})
