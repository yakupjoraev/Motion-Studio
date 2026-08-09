import type { NodeId } from '@motion-studio/schema'
import { act, fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { layoutNodes, renderCanvas } from '../test/harness'
import { stubGestureEnvironment } from '../test/pointer'
import { type FakeScene, fakeScene } from '../test/scene'

import { RESIZE_HANDLES, RESIZE_VARS, resizeDraft } from './use-resize'

const SQUARE = {
  x: 100,
  y: 100,
  width: 200,
  height: 100,
  top: 100,
  left: 100,
  right: 300,
  bottom: 200,
}

const frames = (count = 4): void => {
  act(() => {
    for (let step = 0; step < count; step += 1) {
      vi.advanceTimersToNextFrame()
    }
  })
}

const mount = (commit = vi.fn(), zoom = 1) => {
  const fake: FakeScene = fakeScene({ root: { children: ['hero'] }, hero: { name: 'Hero' } })
  const view = renderCanvas(fake, {
    resize: { commit, resizable: () => true },
    initialTransform: { zoom, pan: { x: 0, y: 0 } },
  })

  layoutNodes({ hero: SQUARE })
  frames()
  act(() => fake.setSelection([fake.id('hero')]))
  frames()

  return { commit, fake, id: fake.id('hero'), view }
}

const node = (id: NodeId): HTMLElement =>
  document.querySelector<HTMLElement>(`[data-node-id="${id}"]`) as HTMLElement

const handle = (direction: string): HTMLElement =>
  screen
    .getByTestId('resize-handles')
    .querySelector<HTMLElement>(`[data-direction="${direction}"]`) as HTMLElement

beforeEach(() => {
  vi.useFakeTimers()
  stubGestureEnvironment()
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('resizeDraft', () => {
  const start = { width: 200, height: 100 }

  it('moves the edge the handle owns and leaves the other axis alone', () => {
    expect(resizeDraft(start, { x: 30, y: 30 }, { signX: 1, signY: 0 }, NONE)).toEqual({
      width: 230,
      height: 100,
    })
  })

  it('grows a west handle when the pointer moves left', () => {
    expect(resizeDraft(start, { x: -30, y: 0 }, { signX: -1, signY: 0 }, NONE)).toEqual({
      width: 230,
      height: 100,
    })
  })

  it('applies the drag to both edges on Alt — ADR-097', () => {
    expect(resizeDraft(start, { x: 30, y: 0 }, { signX: 1, signY: 0 }, ALT)).toEqual({
      width: 260,
      height: 100,
    })
  })

  it('keeps the ratio on Shift, from whichever axis the handle owns', () => {
    expect(resizeDraft(start, { x: 100, y: 0 }, { signX: 1, signY: 0 }, SHIFT)).toEqual({
      width: 300,
      height: 150,
    })
    expect(resizeDraft(start, { x: 0, y: 50 }, { signX: 0, signY: 1 }, SHIFT)).toEqual({
      width: 300,
      height: 150,
    })
  })

  it('never goes below one canvas unit', () => {
    expect(resizeDraft(start, { x: -900, y: -900 }, { signX: 1, signY: 1 }, NONE)).toEqual({
      width: 1,
      height: 1,
    })
  })
})

const NONE = { shift: false, alt: false }
const SHIFT = { shift: true, alt: false }
const ALT = { shift: false, alt: true }

describe('ResizeHandles', () => {
  it('draws eight named handles on the one selected node', () => {
    mount()

    expect(RESIZE_HANDLES).toHaveLength(8)
    expect(screen.getByLabelText('Resize bottom-right')).toBeInTheDocument()
    expect(screen.getByTestId('resize-handles').querySelectorAll('button')).toHaveLength(8)
  })

  it('keeps the canvas a single tab stop — ADR-096', () => {
    mount()

    for (const button of screen.getByTestId('resize-handles').querySelectorAll('button')) {
      expect(button).toHaveAttribute('tabindex', '-1')
    }
  })

  it('hides the handles below 40 % zoom and shows them at it', () => {
    const { view } = mount(vi.fn(), 0.3)

    expect(screen.getByTestId('resize-handles').dataset['zoomedOut']).toBe('true')

    view.unmount()
    mount(vi.fn(), 0.4)

    expect(screen.getByTestId('resize-handles').dataset['zoomedOut']).toBe('false')
  })

  it('leaves the handles off a block that cannot take a size — ADR-108', () => {
    const fake = fakeScene({ root: { children: ['hero'] }, hero: { name: 'Hero' } })

    renderCanvas(fake, { resize: { commit: vi.fn(), resizable: () => false } })
    act(() => fake.setSelection([fake.id('hero')]))

    expect(screen.queryByTestId('resize-handles')).not.toBeInTheDocument()
  })

  it('leaves the handles out of a multi-selection', () => {
    const fake = fakeScene({ root: { children: ['a', 'b'] }, a: {}, b: {} })

    renderCanvas(fake, { resize: { commit: vi.fn(), resizable: () => true } })
    act(() => fake.setSelection([fake.id('a'), fake.id('b')]))

    expect(screen.queryByTestId('resize-handles')).not.toBeInTheDocument()
  })

  it('writes the draft on the node during the drag and commits once on release', () => {
    const { commit, id } = mount()

    fireEvent.pointerDown(handle('se'), { pointerId: 3, clientX: 300, clientY: 200 })
    fireEvent.pointerMove(window, { pointerId: 3, clientX: 360, clientY: 230 })

    expect(node(id).style.getPropertyValue(RESIZE_VARS.width)).toBe('260px')
    expect(node(id).style.getPropertyValue(RESIZE_VARS.height)).toBe('130px')
    expect(node(id)).toHaveAttribute('data-resizing', 'true')
    expect(commit).not.toHaveBeenCalled()

    fireEvent.pointerUp(window, { pointerId: 3 })

    expect(commit).toHaveBeenCalledTimes(1)
    expect(commit).toHaveBeenCalledWith(id, { width: 260, height: 130 })
    expect(node(id)).not.toHaveAttribute('data-resizing')
  })

  it('measures the drag in canvas units, so the same travel is the same size at any zoom', () => {
    const { commit, id } = mount(vi.fn(), 2)

    fireEvent.pointerDown(handle('e'), { pointerId: 4, clientX: 300, clientY: 150 })
    fireEvent.pointerMove(window, { pointerId: 4, clientX: 340, clientY: 150 })
    fireEvent.pointerUp(window, { pointerId: 4 })

    // The node measures 200 screen px at zoom 2, so it is 100 canvas units wide, and 40 px of
    // pointer travel is 20 of them.
    expect(commit).toHaveBeenCalledWith(id, { width: 120, height: 50 })
  })

  it('resizes from the keyboard with the combinations SHORTCUTS.md assigns', () => {
    const { commit, id } = mount()
    const root = screen.getByTestId('canvas-root')

    fireEvent.keyDown(root, { key: 'ArrowRight', ctrlKey: true, altKey: true })

    expect(commit).toHaveBeenCalledWith(id, { width: 201, height: 100 })

    fireEvent.keyDown(root, { key: 'ArrowDown', ctrlKey: true, altKey: true, shiftKey: true })

    expect(commit).toHaveBeenLastCalledWith(id, { width: 200, height: 110 })
  })

  it('leaves the node where it is: a resize is not a nudge', () => {
    const { fake } = mount()

    fireEvent.keyDown(screen.getByTestId('canvas-root'), {
      key: 'ArrowRight',
      ctrlKey: true,
      altKey: true,
    })

    expect(fake.selection.nudge).not.toHaveBeenCalled()
  })

  it('takes the arrows on a focused handle, in that handle’s own direction', () => {
    const { commit, id } = mount()

    fireEvent.keyDown(handle('w'), { key: 'ArrowRight' })

    expect(commit).toHaveBeenCalledWith(id, { width: 199, height: 100 })

    fireEvent.keyDown(handle('e'), { key: 'ArrowRight', shiftKey: true })

    expect(commit).toHaveBeenLastCalledWith(id, { width: 210, height: 100 })
  })

  it('ignores an arrow the handle has no axis for', () => {
    const { commit } = mount()

    fireEvent.keyDown(handle('n'), { key: 'ArrowRight' })

    expect(commit).not.toHaveBeenCalled()
  })
})
