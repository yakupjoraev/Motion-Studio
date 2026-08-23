import { commands } from '@motion-studio/editor'
import { type NodeId, blockId, createEmptyDocument, nodeId } from '@motion-studio/schema'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useStudioStore } from '../../../store/editor-store'

import { ToastProvider } from '@motion-studio/ui'
import { CanvasHost } from './canvas-host'
import { COMPARISON_FRAMES } from './multi-frame-view'

let counter = 0

const nextId = (): NodeId => {
  counter += 1

  return nodeId(`node_m${counter}`)
}

const state = () => useStudioStore.getState()

const insertHeading = (): NodeId => {
  const id = nextId()

  act(() => {
    state().dispatch(
      commands.insertBlock({
        blockId: blockId('heading'),
        parentId: state().document.rootId,
        index: 0,
        slot: 'children',
        id,
      }),
    )
  })

  return id
}

beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe(): void {}
      disconnect(): void {}
    },
  )

  act(() => {
    state().replaceDocument(createEmptyDocument({ ids: () => nextId() }))
    state().clearSelection()
    state().setBreakpoint('base')

    if (state().viewport.multiFrame) {
      state().toggleMultiFrame()
    }
  })
})

/**
 * The canvas ports publish the Copy React confirmation, so the host needs the provider the studio
 * shell gives it. Rendering it bare is the one arrangement the application never produces.
 */
const Host = () => (
  <ToastProvider>
    <CanvasHost />
  </ToastProvider>
)
describe('multi-frame comparison', () => {
  it('is off until it is asked for, and then draws base, md and xl', () => {
    render(<Host />)

    expect(screen.queryByTestId('multi-frame-view')).toBeNull()
    expect(screen.getByTestId('canvas-root')).toBeInTheDocument()

    act(() => state().toggleMultiFrame())

    expect(screen.getByTestId('multi-frame-view')).toBeInTheDocument()
    expect(screen.queryByTestId('canvas-root')).toBeNull()

    for (const breakpoint of COMPARISON_FRAMES) {
      expect(screen.getByTestId(`frame-${breakpoint}`)).toBeInTheDocument()
    }
  })

  it('resolves each frame at its own breakpoint — ADR-163', () => {
    const heading = insertHeading()

    act(() => {
      state().dispatch(
        commands.setResponsiveProp({
          nodeId: heading,
          breakpoint: 'md',
          path: 'level',
          value: 4,
        }),
      )
      state().toggleMultiFrame()
    })
    render(<Host />)

    // The base frame keeps the block's own level; `md` and up take the override.
    expect(
      within(screen.getByTestId('frame-base')).getByRole('heading', { level: 2 }),
    ).toBeInTheDocument()
    expect(
      within(screen.getByTestId('frame-md')).getByRole('heading', { level: 4 }),
    ).toBeInTheDocument()
    expect(
      within(screen.getByTestId('frame-xl')).getByRole('heading', { level: 4 }),
    ).toBeInTheDocument()
  })

  it('marks the frame an inspector edit lands on, and only that one', () => {
    act(() => {
      state().setBreakpoint('md')
      state().toggleMultiFrame()
    })

    expect(screen.queryByText('editing')).toBeNull()

    render(<Host />)

    expect(within(screen.getByTestId('frame-md')).getByText('editing')).toBeInTheDocument()
    expect(within(screen.getByTestId('frame-base')).queryByText('editing')).toBeNull()
    expect(within(screen.getByTestId('frame-xl')).queryByText('editing')).toBeNull()
  })

  it('syncs the selection: clicking a node in any frame selects it once', async () => {
    const heading = insertHeading()

    act(() => state().toggleMultiFrame())
    render(<Host />)

    await userEvent.click(within(screen.getByTestId('frame-xl')).getByRole('heading', { level: 2 }))

    expect(state().selection.ids).toEqual([heading])

    // Every frame draws the same node, so the selection is the same in all three by construction.
    expect(screen.getAllByText('Heading')).toHaveLength(COMPARISON_FRAMES.length)
  })

  it('clears the selection when the click lands beside the frames', async () => {
    const heading = insertHeading()

    act(() => {
      state().select([heading])
      state().toggleMultiFrame()
    })
    render(<Host />)

    await userEvent.click(screen.getByTestId('multi-frame-view'))

    expect(state().selection.ids).toEqual([])
  })
})
