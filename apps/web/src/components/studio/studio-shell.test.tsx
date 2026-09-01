import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { useRef } from 'react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { PANEL_BOUNDS, PANEL_LAYOUT_KEY, PANEL_VARIABLE } from '../../hooks/panel-layout'
import { useStudioStore } from '../../store/editor-store'

import { StudioShell } from './studio-shell'

const readVariable = (name: string): string => document.documentElement.style.getPropertyValue(name)

const renderShell = () => render(<StudioShell canvas={<div data-testid="canvas-island" />} />)

beforeEach(() => {
  window.localStorage.clear()
  document.documentElement.removeAttribute('style')
  act(() => useStudioStore.getState().setBreakpoint('base'))
})

afterEach(() => {
  vi.useRealTimers()
})

const BACKSLASH = String.fromCharCode(92)

/**
 * The panel binding, sent as a real key event. `user.keyboard` cannot express it: a backslash is its
 * own escape character, so the sequence reaches its parser as an escaped brace and no character
 * event is sent at all — which is why this used to look like a working test of nothing.
 */
const togglePanelKey = async (init: KeyboardEventInit = {}): Promise<void> => {
  await act(async () => {
    fireEvent.keyDown(document, {
      key: BACKSLASH,
      code: 'Backslash',
      ctrlKey: true,
      ...init,
    })
  })
}

describe('StudioShell', () => {
  it('renders the three focus regions and the two bars', () => {
    renderShell()

    expect(screen.getByRole('complementary', { name: 'Left panel' })).toBeInTheDocument()
    expect(screen.getByRole('main', { name: 'Canvas' })).toBeInTheDocument()
    expect(screen.getByRole('complementary', { name: 'Inspector' })).toBeInTheDocument()
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })

  it('shows the sub-1024 notice with a route out, always in the DOM so it needs no hydration', () => {
    renderShell()

    expect(screen.getByText('Motion Studio needs a wider screen.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /block gallery/ })).toHaveAttribute('href', '/blocks')
  })

  it.each(['Undo', 'Redo', 'Zoom', 'Command palette'])(
    'leaves %s genuinely disabled rather than inert-looking',
    (name) => {
      renderShell()

      expect(screen.getByRole('button', { name })).toBeDisabled()
    },
  )

  it('offers the six breakpoints, with the active one checked', async () => {
    const user = userEvent.setup()

    renderShell()

    const group = screen.getByRole('radiogroup', { name: 'Breakpoint' })
    const options = within(group).getAllByRole('radio')

    expect(options).toHaveLength(6)
    expect(within(group).getByRole('radio', { name: /^Base/ })).toBeChecked()

    await user.click(within(group).getByRole('radio', { name: /^Medium/ }))

    expect(useStudioStore.getState().viewport.breakpoint).toBe('md')
  })

  describe('F2 focus cycling', () => {
    it('walks canvas → left → inspector → canvas', async () => {
      const user = userEvent.setup()

      renderShell()

      const canvas = screen.getByRole('main', { name: 'Canvas' })
      const left = screen.getByRole('complementary', { name: 'Left panel' })
      const inspector = screen.getByRole('complementary', { name: 'Inspector' })

      canvas.focus()

      await user.keyboard('{F2}')
      expect(left).toHaveFocus()

      await user.keyboard('{F2}')
      expect(inspector).toHaveFocus()

      await user.keyboard('{F2}')
      expect(canvas).toHaveFocus()
    })

    it('starts at the canvas when focus is outside every region', async () => {
      const user = userEvent.setup()

      renderShell()

      await user.keyboard('{F2}')

      expect(screen.getByRole('main', { name: 'Canvas' })).toHaveFocus()
    })
  })

  describe('panel shortcuts', () => {
    /*
     * The keyboard map arrives in its own chunk (ADR-152), so `next/dynamic` resolves it after the
     * first render and every shortcut test waits for it. Importing it here first puts it in the
     * module cache: the wait is then a render rather than a transform of the chunk and its
     * dependencies, which is what expired — twice — on a machine running the whole suite.
     */
    beforeAll(async () => {
      await import('./shortcuts/shortcut-host')
    }, 60_000)

    const shortcutsMounted = (): Promise<HTMLElement> =>
      screen.findByTestId('shortcut-host', {}, { timeout: 5000 })

    it('collapses the left panel on Mod+\\ and restores it', async () => {
      renderShell()
      await shortcutsMounted()

      await togglePanelKey()
      expect(readVariable(PANEL_VARIABLE.left.track)).toBe('0px')

      await togglePanelKey()
      expect(readVariable(PANEL_VARIABLE.left.track)).toBe(`${PANEL_BOUNDS.left.initial}px`)
    })

    it('collapses the inspector on Mod+Alt+\\ and leaves the left panel alone', async () => {
      renderShell()
      await shortcutsMounted()

      await togglePanelKey({ altKey: true })

      expect(readVariable(PANEL_VARIABLE.right.track)).toBe('0px')
      expect(readVariable(PANEL_VARIABLE.left.track)).toBe('')
    })

    it('keeps the collapsed panel out of the tab order', async () => {
      renderShell()
      await shortcutsMounted()

      await togglePanelKey()

      expect(screen.getByRole('complementary', { name: 'Left panel' })).toHaveAttribute('inert')
    })
  })

  describe('resize', () => {
    it('steps the width with the arrow keys and clamps at the bounds', async () => {
      const user = userEvent.setup()

      renderShell()

      const handle = screen.getByRole('separator', { name: 'Left panel width' })

      handle.focus()
      await user.keyboard('{ArrowRight}')

      expect(handle).toHaveAttribute('aria-valuenow', String(PANEL_BOUNDS.left.initial + 8))
      expect(readVariable(PANEL_VARIABLE.left.track)).toBe(`${PANEL_BOUNDS.left.initial + 8}px`)

      await user.keyboard('{End}')
      expect(readVariable(PANEL_VARIABLE.left.track)).toBe(`${PANEL_BOUNDS.left.max}px`)

      await user.keyboard('{ArrowRight}')
      expect(readVariable(PANEL_VARIABLE.left.track)).toBe(`${PANEL_BOUNDS.left.max}px`)
    })

    it('moves the inspector the other way, because its handle is on its left edge', async () => {
      const user = userEvent.setup()

      renderShell()

      const handle = screen.getByRole('separator', { name: 'Inspector width' })

      handle.focus()
      await user.keyboard('{ArrowRight}')

      expect(readVariable(PANEL_VARIABLE.right.track)).toBe(`${PANEL_BOUNDS.right.initial - 8}px`)
    })

    it('persists the committed width once, after the debounce', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true })

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

      renderShell()

      const handle = screen.getByRole('separator', { name: 'Left panel width' })

      handle.focus()
      await user.keyboard('{ArrowRight}')

      expect(window.localStorage.getItem(PANEL_LAYOUT_KEY)).toBeNull()

      vi.advanceTimersByTime(500)

      expect(JSON.parse(window.localStorage.getItem(PANEL_LAYOUT_KEY) ?? '{}')).toMatchObject({
        left: PANEL_BOUNDS.left.initial + 8,
      })
    })
  })

  it('restores a stored layout into the handle it belongs to', () => {
    window.localStorage.setItem(PANEL_LAYOUT_KEY, JSON.stringify({ left: 340, right: 300 }))

    renderShell()

    expect(screen.getByRole('separator', { name: 'Left panel width' })).toHaveAttribute(
      'aria-valuenow',
      '340',
    )
  })

  it('opens with the defaults when the stored layout is corrupt', () => {
    window.localStorage.setItem(PANEL_LAYOUT_KEY, '{ not json')

    expect(() => renderShell()).not.toThrow()
    expect(screen.getByRole('separator', { name: 'Left panel width' })).toHaveAttribute(
      'aria-valuenow',
      String(PANEL_BOUNDS.left.initial),
    )
  })

  it('has no axe violations', async () => {
    const { container } = renderShell()

    expect(await axe(container)).toHaveNoViolations()
  })
})

/** The render counter the prompt's § Verify asks for, kept as a test rather than removed. */
function CanvasCounter({ onRender }: { readonly onRender: () => void }) {
  const renders = useRef(0)

  renders.current += 1
  onRender()

  return <div data-testid="canvas-island">{renders.current}</div>
}

describe('a resize does not render the canvas area', () => {
  it('renders it once across a full drag and its commit', async () => {
    const user = userEvent.setup()
    const onRender = vi.fn()

    Element.prototype.setPointerCapture = vi.fn()
    Element.prototype.releasePointerCapture = vi.fn()

    render(<StudioShell canvas={<CanvasCounter onRender={onRender} />} />)

    const handle = screen.getByRole('separator', { name: 'Left panel width' })
    const before = onRender.mock.calls.length

    await user.pointer([
      { target: handle, keys: '[MouseLeft>]', coords: { clientX: 280, clientY: 100 } },
      { target: handle, coords: { clientX: 300, clientY: 100 } },
      { target: handle, coords: { clientX: 320, clientY: 100 } },
      { target: handle, keys: '[/MouseLeft]', coords: { clientX: 320, clientY: 100 } },
    ])

    expect(readVariable(PANEL_VARIABLE.left.track)).toBe('320px')
    expect(onRender.mock.calls.length).toBe(before)
  })
})
