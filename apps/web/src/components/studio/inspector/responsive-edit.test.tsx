import { commands } from '@motion-studio/editor'
import {
  type ControlDescriptor,
  type NodeId,
  blockId,
  createEmptyDocument,
  nodeId,
} from '@motion-studio/schema'
import { act, render, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useStudioStore } from '../../../store/editor-store'

import { Inspector } from './inspector'
import { useControlCommit } from './use-control-commit'
import {
  HINT_EDIT_THRESHOLD,
  HINT_WINDOW_MS,
  dismissResponsiveHint,
  editCoalesceKey,
  recordResponsiveEdit,
  resetResponsiveHint,
} from './use-responsive-edit'

let counter = 0

const nextId = (): NodeId => {
  counter += 1

  return nodeId(`node_r${counter}`)
}

const state = () => useStudioStore.getState()

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

const PADDING: ControlDescriptor = { path: 'padding', kind: 'select', label: 'Padding' }

const reset = (): HTMLElement => screen.getByRole('button', { name: 'Reset Padding' })

beforeEach(() => {
  Element.prototype.hasPointerCapture = vi.fn(() => false)
  Element.prototype.releasePointerCapture = vi.fn()
  Element.prototype.scrollIntoView = vi.fn()
  window.localStorage.clear()
  resetResponsiveHint()

  act(() => {
    state().replaceDocument(createEmptyDocument({ ids: () => nextId() }))
    state().clearSelection()
    state().setBreakpoint('base')
  })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('where an edit lands', () => {
  it('writes the base props at base and an override anywhere else', () => {
    const section = insert('section')
    const { result, rerender } = renderHook(() => useControlCommit(PADDING, [section]))

    act(() => result.current.onCommit('sm'))

    expect(state().document.nodes[section]?.props['padding']).toBe('sm')
    expect(state().document.nodes[section]?.responsive).toEqual({})

    act(() => state().setBreakpoint('md'))
    rerender()
    act(() => result.current.onCommit('lg'))

    expect(state().document.nodes[section]?.props['padding']).toBe('sm')
    expect(state().document.nodes[section]?.responsive['md']).toEqual({ padding: 'lg' })
  })

  it('keys the coalescing by breakpoint, so scrubbing at md and then at lg is two entries', () => {
    const section = insert('section')
    const { result, rerender } = renderHook(() => useControlCommit(PADDING, [section]))

    expect(editCoalesceKey('md', 'padding')).not.toBe(editCoalesceKey('lg', 'padding'))

    act(() => state().setBreakpoint('md'))
    rerender()

    const before = state().history.past.length

    act(() => result.current.onCommit('lg'))
    act(() => state().setBreakpoint('lg'))
    rerender()
    act(() => result.current.onCommit('xl'))

    expect(state().history.past.length - before).toBe(2)
  })

  it('removes the override key on reset rather than writing the inherited value back', () => {
    const section = insert('section')

    act(() => {
      state().dispatch(
        commands.setResponsiveProp({
          nodeId: section,
          breakpoint: 'md',
          path: 'padding',
          value: 'xl',
        }),
      )
      state().setBreakpoint('md')
    })

    const { result } = renderHook(() => useControlCommit(PADDING, [section]))

    act(() => result.current.onReset())

    // A key set back to the base value would emit a dead Tailwind class on export. The command
    // drops the breakpoint's object once its last key goes, so the assertion is on the whole map.
    expect(state().document.nodes[section]?.responsive['md']?.['padding']).toBeUndefined()
    expect(state().document.nodes[section]?.props['padding']).toBe('lg')
  })
})

describe('what the row says about where its value came from', () => {
  const rowFor = async (section: NodeId): Promise<HTMLElement> => {
    act(() => state().select([section]))
    render(<Inspector />)

    /*
     * A longer budget than the one-second default: the first render in this file mounts the whole
     * inspector, and a role query with a name computes an accessible name for every candidate. On the
     * CI runner that has taken over a second since 22 August, which made a real assertion look flaky.
     */
    return screen.findByRole('combobox', { name: 'Padding' }, { timeout: 8_000 })
  }

  it('marks nothing at base', async () => {
    const section = insert('section')
    const control = await rowFor(section)

    expect(control).not.toHaveAccessibleDescription()
    expect(document.querySelector('[data-override]')).toBeNull()
  })

  it('marks the value overridden where the override is', async () => {
    const section = insert('section')

    act(() => {
      state().dispatch(
        commands.setResponsiveProp({
          nodeId: section,
          breakpoint: 'md',
          path: 'padding',
          value: 'xl',
        }),
      )
      state().setBreakpoint('md')
    })

    const control = await rowFor(section)

    expect(control).toHaveAccessibleDescription('Overridden at md')
    expect(document.querySelector('[data-override="overridden"]')).toHaveAttribute(
      'title',
      'Overridden at md',
    )
    expect(reset()).toBeEnabled()
  })

  it('marks the value inherited at a larger breakpoint, naming the one it came from', async () => {
    const section = insert('section')

    act(() => {
      state().dispatch(
        commands.setResponsiveProp({
          nodeId: section,
          breakpoint: 'md',
          path: 'padding',
          value: 'xl',
        }),
      )
      state().setBreakpoint('lg')
    })

    const control = await rowFor(section)

    expect(control).toHaveAccessibleDescription('Inherited from md')
    expect(document.querySelector('[data-override="inherited"]')).not.toBeNull()
    // Nothing to remove here: the override belongs to `md`.
    expect(reset()).toBeDisabled()
  })
})

describe('the editing-scope guardrail', () => {
  it('fires on the third responsive edit inside the window and not before', async () => {
    const start = 1_700_000_000_000

    render(<Inspector />)

    expect(screen.queryByTestId('responsive-hint')).toBeNull()

    act(() => {
      state().setBreakpoint('md')
      recordResponsiveEdit(editCoalesceKey('md', 'padding'), start)
      recordResponsiveEdit(editCoalesceKey('md', 'gap'), start + 1_000)
    })

    expect(screen.queryByTestId('responsive-hint')).toBeNull()

    act(() => recordResponsiveEdit(editCoalesceKey('md', 'align'), start + 2_000))

    // The hint is a chunk of its own, so it lands a tick after the count crosses the threshold.
    expect(await screen.findByTestId('responsive-hint')).toHaveTextContent('Switch to base')
  })

  it('counts an edit once however many writes a drag makes of it', () => {
    const start = 1_700_000_000_000

    render(<Inspector />)

    act(() => {
      state().setBreakpoint('md')

      for (let frame = 0; frame < HINT_EDIT_THRESHOLD * 10; frame += 1) {
        recordResponsiveEdit(editCoalesceKey('md', 'padding'), start + frame * 33)
      }
    })

    expect(screen.queryByTestId('responsive-hint')).toBeNull()
  })

  it('forgets edits older than the window', () => {
    const start = 1_700_000_000_000

    render(<Inspector />)

    act(() => {
      state().setBreakpoint('md')
      recordResponsiveEdit(editCoalesceKey('md', 'padding'), start)
      recordResponsiveEdit(editCoalesceKey('md', 'gap'), start + 1_000)
      recordResponsiveEdit(editCoalesceKey('md', 'align'), start + HINT_WINDOW_MS + 1)
    })

    expect(screen.queryByTestId('responsive-hint')).toBeNull()
  })

  it('stays dismissed for the rest of the session', async () => {
    const start = 1_700_000_000_000

    render(<Inspector />)

    act(() => {
      state().setBreakpoint('md')

      for (const path of ['padding', 'gap', 'align']) {
        recordResponsiveEdit(editCoalesceKey('md', path), start)
      }
    })

    await userEvent.click(await screen.findByRole('button', { name: 'Dismiss hint' }))

    expect(screen.queryByTestId('responsive-hint')).toBeNull()

    act(() => {
      for (const path of ['width', 'height', 'radius']) {
        recordResponsiveEdit(editCoalesceKey('md', path), start + 100)
      }
    })

    expect(screen.queryByTestId('responsive-hint')).toBeNull()
  })

  it('never fires at base, which is the place it points at', () => {
    const section = insert('section')
    const { result } = renderHook(() => useControlCommit(PADDING, [section]))

    render(<Inspector />)

    act(() => {
      result.current.onCommit('sm')
      result.current.onCommit('md')
      result.current.onCommit('lg')
    })

    expect(screen.queryByTestId('responsive-hint')).toBeNull()
  })

  it('is dismissible without the store hearing about it — ADR-165', () => {
    const start = 1_700_000_000_000

    act(() => {
      for (const path of ['padding', 'gap', 'align']) {
        recordResponsiveEdit(editCoalesceKey('md', path), start)
      }
    })

    const version = state().version

    dismissResponsiveHint()

    expect(state().version).toBe(version)
    expect(window.localStorage.getItem('motion-studio.responsive-hint')).toBeNull()
  })
})

describe('the scope reminder', () => {
  it('names the breakpoint being edited, and says nothing at base', () => {
    render(<Inspector />)

    expect(screen.queryByTestId('responsive-header')).toBeNull()

    act(() => state().setBreakpoint('md'))

    expect(screen.getByTestId('responsive-header')).toHaveTextContent('Editing md and up')
    expect(screen.getByTestId('responsive-header')).toHaveTextContent('768 px and wider')
  })
})
