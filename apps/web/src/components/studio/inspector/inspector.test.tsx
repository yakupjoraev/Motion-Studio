import { commands } from '@motion-studio/editor'
import { type NodeId, blockId, createEmptyDocument, nodeId } from '@motion-studio/schema'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { useStudioStore } from '../../../store/editor-store'

import { Inspector } from './inspector'

let counter = 0

const nextId = (): NodeId => {
  counter += 1

  return nodeId(`node_i${counter}`)
}

const state = () => useStudioStore.getState()
const root = (): NodeId => state().document.rootId

const insert = (block: string, parentId = root()): NodeId => {
  const id = nextId()

  act(() => {
    state().dispatch(
      commands.insertBlock({ blockId: blockId(block), parentId, index: 0, slot: 'children', id }),
    )
  })

  return id
}

/*
 * The block body is a chunk of its own, and transforming its graph takes about eight seconds on a
 * cold Vite cache — longer than a test's own timeout. It used to be warm by accident: the store's
 * eager `@motion-studio/blocks` import paid for it during setup, and ADR-312 removed that import.
 * Warming it here pays the same cost where it belongs, and mirrors the shell, which prefetches it.
 */
beforeAll(async () => {
  await import('./block-inspector')
}, 60_000)

beforeEach(() => {
  Element.prototype.hasPointerCapture = vi.fn(() => false)
  Element.prototype.releasePointerCapture = vi.fn()
  Element.prototype.scrollIntoView = vi.fn()
  window.localStorage.clear()

  act(() => {
    state().replaceDocument(createEmptyDocument({ ids: () => nextId() }))
    state().clearSelection()
    state().setBreakpoint('base')
  })
})

describe('Inspector', () => {
  it('shows document settings when nothing is selected', () => {
    render(<Inspector />)

    expect(screen.getByTestId('inspector-empty')).toBeInTheDocument()
    expect(screen.getByText('Canvas width')).toBeInTheDocument()
    expect(screen.getByText('1440px')).toBeInTheDocument()
  })

  it('generates a heading’s controls from its own metadata, grouped', async () => {
    const heading = insert('heading')

    act(() => state().select([heading]))
    render(<Inspector />)

    // The block body is a chunk of its own, so a panel with a selection waits for it once.
    expect(await screen.findByTestId('section-content')).toBeInTheDocument()
    expect(screen.getByTestId('section-typography')).toBeInTheDocument()
    // The controls are a chunk below the sections, so they arrive one await later.
    expect(await screen.findByRole('textbox', { name: 'Text' })).toHaveValue('Heading')
    expect(screen.getByRole('spinbutton', { name: 'Level' })).toBeInTheDocument()
  })

  it('gives every control an accessible name', async () => {
    const section = insert('section')

    act(() => state().select([section]))
    render(<Inspector />)

    // A section's controls are a chunk below it; every one of them names itself once it lands.
    const controls = await screen.findAllByRole('combobox')

    for (const control of [...controls, ...screen.queryAllByRole('radiogroup')]) {
      expect(control).toHaveAccessibleName()
    }

    expect(controls.length).toBeGreaterThan(0)
  })

  /**
   * The clock is frozen for this one test, and that is the point of it. ADR-113 makes an edit one
   * history entry by coalescing writes that share a key *within a window*, and the window is 400 ms
   * of wall clock (`COALESCE_WINDOW_MS`). Typing seven characters through `user-event` takes however
   * long the machine takes, so on a loaded CI runner the sequence outran the window and the entry
   * split in two — a red build that says nothing about the behaviour under test.
   *
   * Freezing `Date.now` is narrow enough to be honest: `user-event` schedules on timers and React on
   * `performance.now`, so the only consumer affected is the store's own clock. The window arithmetic
   * itself is covered where it belongs, in `packages/editor/src/history/coalesce.test.ts`.
   */
  it('commits an edit as one history entry', async () => {
    const clock = vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000)

    try {
      const heading = insert('heading')

      act(() => state().select([heading]))
      render(<Inspector />)
      await screen.findByRole('textbox', { name: 'Text' })

      const before = state().history.past.length

      await userEvent.clear(screen.getByRole('textbox', { name: 'Text' }))
      await userEvent.type(screen.getByRole('textbox', { name: 'Text' }), 'Pricing')
      await userEvent.tab()

      expect(state().document.nodes[heading]?.props['text']).toBe('Pricing')
      expect(state().history.past.length - before).toBe(1)
    } finally {
      clock.mockRestore()
    }
  })

  it('writes an override rather than the base value away from base', async () => {
    const section = insert('section')

    act(() => {
      state().select([section])
      state().setBreakpoint('lg')
    })
    render(<Inspector />)

    await userEvent.click(await screen.findByRole('combobox', { name: 'Padding' }))
    await userEvent.click(await screen.findByRole('option', { name: 'sm' }))

    expect(state().document.nodes[section]?.props['padding']).toBe('lg')
    expect(state().document.nodes[section]?.responsive['lg']).toEqual({ padding: 'sm' })
  })

  it('hides sizing controls on a block that cannot take a size — ADR-108', async () => {
    const container = insert('container')

    act(() => state().select([container]))
    render(<Inspector />)

    // The container declares no width or height, and its capabilities say so: no such row exists.
    expect(await screen.findByTestId('section-layout')).toBeInTheDocument()
    expect(screen.queryByRole('spinbutton', { name: 'Width' })).not.toBeInTheDocument()
  })

  it('reports the effects and the code it cannot show yet', async () => {
    const heading = insert('heading')

    act(() => state().select([heading]))
    render(<Inspector />)

    expect(await screen.findByTestId('effects-summary')).toHaveTextContent('No effects')
    expect(screen.getByTestId('code-summary')).toHaveTextContent('<heading>')
  })

  it('remembers a collapsed section across a remount', async () => {
    const heading = insert('heading')

    act(() => state().select([heading]))

    const first = render(<Inspector />)

    await userEvent.click(await screen.findByTestId('section-typography'))

    expect(state().ui.rightPanel.openSections['typography']).toBe(false)

    first.unmount()
    render(<Inspector />)

    expect(state().ui.rightPanel.openSections['typography']).toBe(false)
    expect(window.localStorage.getItem('motion-studio.inspector.sections')).toContain('typography')
  })
})

describe('Inspector, multi-selection', () => {
  it('shows shared properties, marks a disagreement Mixed, and edits both in one step', async () => {
    const first = insert('heading')
    const second = insert('heading')

    act(() => {
      state().dispatch(commands.setProp({ nodeId: second, path: 'text', value: 'Other' }))
      state().select([first, second])
    })
    render(<Inspector />)

    expect(await screen.findByTestId('inspector-multi')).toHaveTextContent('2 blocks selected')

    const text = screen.getByRole('textbox', { name: 'Text' })

    expect(text).toHaveAttribute('placeholder', 'Mixed')

    const before = state().history.past.length

    await userEvent.type(text, 'Shared')
    await userEvent.tab()

    expect(state().document.nodes[first]?.props['text']).toBe('Shared')
    expect(state().document.nodes[second]?.props['text']).toBe('Shared')
    expect(state().history.past.length - before).toBe(1)
  })

  it('hides a property the other block does not have', async () => {
    const heading = insert('heading')
    const section = insert('section')

    act(() => state().select([heading, section]))
    render(<Inspector />)

    const panel = await screen.findByTestId('inspector-multi')

    await within(panel).findAllByRole('radiogroup')

    // `align` is on both; `text` is only on the heading.
    expect(screen.queryByRole('textbox', { name: 'Text' })).not.toBeInTheDocument()
  })
})
