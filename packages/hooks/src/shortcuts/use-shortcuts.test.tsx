import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { type Shortcut, createShortcutRegistry } from './registry'
import { isTextEntry, resolveScope, useShortcuts } from './use-shortcuts'

interface Ctx {
  readonly hasSelection: boolean
}

const context: Ctx = { hasSelection: true }

const build = (shortcuts: readonly Shortcut<Ctx>[]) => createShortcutRegistry<Ctx>(shortcuts)

function Harness({
  registry,
  ctx = context,
}: {
  readonly registry: ReturnType<typeof build>
  readonly ctx?: Ctx
}) {
  useShortcuts({ registry, context: ctx, platform: 'other' })

  return (
    <div>
      <div data-shortcut-scope="canvas" data-testid="canvas" tabIndex={-1}>
        <input data-testid="field" defaultValue="Hero" />
      </div>
      <div data-shortcut-scope="layers" data-testid="layers" tabIndex={-1} />
    </div>
  )
}

const press = (
  target: Element | Document,
  key: string,
  init: Partial<KeyboardEventInit> & { code?: string } = {},
): void => {
  fireEvent.keyDown(target, { key, code: init.code ?? '', ...init })
}

describe('the text-input guard', () => {
  it('lets Delete reach the field instead of deleting the node', () => {
    const deleteNode = vi.fn()
    const registry = build([
      {
        id: 'delete',
        keys: 'delete',
        label: 'Delete',
        group: 'Editing',
        scope: 'global',
        run: deleteNode,
      },
    ])

    render(<Harness registry={registry} />)
    const field = screen.getByTestId('field')
    field.focus()
    press(field, 'Delete', { code: 'Delete' })

    expect(deleteNode).not.toHaveBeenCalled()
  })

  it('leaves Mod+Z to the field, so the browser undoes the typing (ADR-148)', () => {
    const undo = vi.fn()
    const registry = build([
      { id: 'undo', keys: 'mod+z', label: 'Undo', group: 'Global', scope: 'global', run: undo },
    ])

    render(<Harness registry={registry} />)
    const field = screen.getByTestId('field')
    field.focus()
    press(field, 'z', { code: 'KeyZ', ctrlKey: true })

    // The document's undo does not run, and the event is not prevented — which is what lets the
    // field undo the user's typing instead.
    expect(undo).not.toHaveBeenCalled()

    const event = new KeyboardEvent('keydown', {
      key: 'z',
      code: 'KeyZ',
      ctrlKey: true,
      cancelable: true,
      bubbles: true,
    })
    field.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(false)
  })

  it.each(['escape', 'mod+enter', 'mod+s'])('passes %s through to the registry', (keys) => {
    const run = vi.fn()
    const registry = build([{ id: keys, keys, label: keys, group: 'Global', scope: 'global', run }])

    render(<Harness registry={registry} />)
    const field = screen.getByTestId('field')
    field.focus()

    if (keys === 'escape') {
      press(field, 'Escape', { code: 'Escape' })
    } else if (keys === 'mod+enter') {
      press(field, 'Enter', { code: 'Enter', ctrlKey: true })
    } else {
      press(field, 's', { code: 'KeyS', ctrlKey: true })
    }

    expect(run).toHaveBeenCalledTimes(1)
  })

  it('does not guard a checkbox, which holds no text', () => {
    const { container } = render(<input data-testid="checkbox" type="checkbox" />)
    const checkbox = container.querySelector('input')

    expect(isTextEntry(checkbox)).toBe(false)
  })

  it('guards a contenteditable and anything with role=textbox', () => {
    const editable = document.createElement('div')
    editable.setAttribute('contenteditable', 'true')
    const role = document.createElement('div')
    role.setAttribute('role', 'textbox')
    const off = document.createElement('div')
    off.setAttribute('contenteditable', 'false')

    expect(isTextEntry(editable)).toBe(true)
    expect(isTextEntry(role)).toBe(true)
    expect(isTextEntry(off)).toBe(false)
    expect(isTextEntry(null)).toBe(false)
  })
})

describe('scope resolution', () => {
  it('runs the focused scope before global', () => {
    const rename = vi.fn()
    const cycle = vi.fn()
    const registry = build([
      { id: 'cycle', keys: 'f2', label: 'Cycle', group: 'Global', scope: 'global', run: cycle },
      { id: 'rename', keys: 'f2', label: 'Rename', group: 'Layers', scope: 'layers', run: rename },
    ])

    render(<Harness registry={registry} />)
    const layers = screen.getByTestId('layers')
    layers.focus()
    press(layers, 'F2', { code: 'F2' })

    expect(rename).toHaveBeenCalledTimes(1)
    expect(cycle).not.toHaveBeenCalled()
  })

  it('falls back to global when the focused subtree declares no scope', () => {
    const cycle = vi.fn()
    const registry = build([
      { id: 'cycle', keys: 'f2', label: 'Cycle', group: 'Global', scope: 'global', run: cycle },
    ])

    render(<Harness registry={registry} />)
    press(document, 'F2', { code: 'F2' })

    expect(cycle).toHaveBeenCalledTimes(1)
  })

  it('reports a dialog as owning the keyboard whatever holds focus', () => {
    render(
      <div>
        <div data-shortcut-scope="canvas" data-testid="canvas" tabIndex={-1} />
        <div data-shortcut-scope="dialog" />
      </div>,
    )
    screen.getByTestId('canvas').focus()

    expect(resolveScope(document)).toBe('dialog')
  })

  it('ignores an unknown scope value rather than trusting it', () => {
    render(<div data-shortcut-scope="nonsense" data-testid="odd" tabIndex={-1} />)
    screen.getByTestId('odd').focus()

    expect(resolveScope(document)).toBe('global')
  })
})

describe('running a shortcut', () => {
  it('skips one whose when() is false and takes the next candidate', () => {
    const blocked = vi.fn()
    const fallback = vi.fn()
    const registry = build([
      {
        id: 'delete-selection',
        keys: 'delete',
        label: 'Delete',
        group: 'Editing',
        scope: 'canvas',
        when: (ctx) => !ctx.hasSelection,
        run: blocked,
      },
      {
        id: 'delete-global',
        keys: 'delete',
        label: 'Delete',
        group: 'Editing',
        scope: 'global',
        run: fallback,
      },
    ])

    render(<Harness registry={registry} />)
    const canvas = screen.getByTestId('canvas')
    canvas.focus()
    press(canvas, 'Delete', { code: 'Delete' })

    expect(blocked).not.toHaveBeenCalled()
    expect(fallback).toHaveBeenCalledTimes(1)
  })

  it('prevents the browser default unless the shortcut opts out', () => {
    const registry = build([
      { id: 'save', keys: 'mod+s', label: 'Save', group: 'Global', scope: 'global', run: vi.fn() },
      {
        id: 'tab',
        keys: 'tab',
        label: 'Next',
        group: 'Selection',
        scope: 'global',
        preventDefault: false,
        run: vi.fn(),
      },
    ])

    render(<Harness registry={registry} />)

    const save = new KeyboardEvent('keydown', {
      key: 's',
      code: 'KeyS',
      ctrlKey: true,
      cancelable: true,
      bubbles: true,
    })
    document.dispatchEvent(save)
    expect(save.defaultPrevented).toBe(true)

    const tab = new KeyboardEvent('keydown', {
      key: 'Tab',
      code: 'Tab',
      cancelable: true,
      bubbles: true,
    })
    document.dispatchEvent(tab)
    expect(tab.defaultPrevented).toBe(false)
  })

  it('sees the current context without reattaching the listener', () => {
    const run = vi.fn()
    const registry = build([
      {
        id: 'duplicate',
        keys: 'mod+d',
        label: 'Duplicate',
        group: 'Editing',
        scope: 'global',
        when: (ctx) => ctx.hasSelection,
        run,
      },
    ])

    const { rerender } = render(<Harness ctx={{ hasSelection: false }} registry={registry} />)
    press(document, 'd', { code: 'KeyD', ctrlKey: true })
    expect(run).not.toHaveBeenCalled()

    rerender(<Harness ctx={{ hasSelection: true }} registry={registry} />)
    press(document, 'd', { code: 'KeyD', ctrlKey: true })
    expect(run).toHaveBeenCalledTimes(1)
  })

  it('detaches on unmount', () => {
    const run = vi.fn()
    const registry = build([
      { id: 'undo', keys: 'mod+z', label: 'Undo', group: 'Global', scope: 'global', run },
    ])

    const { unmount } = render(<Harness registry={registry} />)
    unmount()
    press(document, 'z', { code: 'KeyZ', ctrlKey: true })

    expect(run).not.toHaveBeenCalled()
  })
})

describe('a delegated binding (ADR-150)', () => {
  it('matches, so the registry knows the key is taken, and then stands aside', () => {
    const run = vi.fn()
    const registry = build([
      {
        id: 'tree-arrow',
        keys: 'up',
        label: 'Move focus',
        group: 'Layers',
        scope: 'layers',
        delegated: true,
        run,
      },
    ])

    render(<Harness registry={registry} />)
    const layers = screen.getByTestId('layers')
    layers.focus()

    const event = new KeyboardEvent('keydown', {
      key: 'ArrowUp',
      code: 'ArrowUp',
      cancelable: true,
      bubbles: true,
    })
    layers.dispatchEvent(event)

    expect(run).not.toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(false)
  })

  it('still shadows a global binding, which is the point of declaring it', () => {
    const globalRun = vi.fn()
    const registry = build([
      {
        id: 'nudge',
        keys: 'up',
        label: 'Nudge',
        group: 'Transform',
        scope: 'global',
        run: globalRun,
      },
      {
        id: 'tree-arrow',
        keys: 'up',
        label: 'Move focus',
        group: 'Layers',
        scope: 'layers',
        delegated: true,
        run: vi.fn(),
      },
    ])

    render(<Harness registry={registry} />)
    const layers = screen.getByTestId('layers')
    layers.focus()
    press(layers, 'ArrowUp', { code: 'ArrowUp' })

    expect(globalRun).not.toHaveBeenCalled()
  })
})
