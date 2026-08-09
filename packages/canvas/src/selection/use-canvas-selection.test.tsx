import { act, fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ANNOUNCE_DEBOUNCE_MS } from '../selection/selection-announcer'
import { pointAt, renderCanvas } from '../test/harness'
import { stubGestureEnvironment } from '../test/pointer'
import { fakeScene } from '../test/scene'

const build = () =>
  fakeScene({
    root: { children: ['hero', 'gallery', 'pinned'], name: 'Page' },
    hero: { children: ['heading'], name: 'Hero' },
    heading: { name: 'Heading' },
    gallery: { children: [], name: 'Gallery' },
    pinned: { children: ['logo'], name: 'Pinned', locked: true },
    logo: { name: 'Logo' },
  })

const press = (init: PointerEventInit = {}) =>
  fireEvent.pointerDown(screen.getByTestId('canvas-root'), {
    button: 0,
    clientX: 40,
    clientY: 40,
    pointerId: 1,
    ...init,
  })

beforeEach(() => {
  vi.useFakeTimers()
  stubGestureEnvironment()
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('useCanvasSelection', () => {
  it('selects the outer container when a nested node is clicked', () => {
    const fake = build()

    renderCanvas(fake)
    pointAt('heading')
    press()

    expect(fake.scene.selectedIds()).toEqual([fake.id('hero')])
    expect(fake.modes).toEqual(['replace'])
  })

  it('selects what a right click points at, so the menu describes that node', () => {
    const fake = build()

    renderCanvas(fake)
    pointAt('gallery')
    fireEvent.contextMenu(screen.getByTestId('canvas-root'), { clientX: 40, clientY: 40 })

    expect(fake.scene.selectedIds()).toEqual([fake.id('gallery')])
  })

  it('keeps a multi-selection when the right click lands inside it', () => {
    const fake = build()

    renderCanvas(fake)
    pointAt('hero')
    press()
    pointAt('gallery')
    press({ shiftKey: true })
    pointAt('gallery')
    fireEvent.contextMenu(screen.getByTestId('canvas-root'), { clientX: 40, clientY: 40 })

    expect(fake.scene.selectedIds()).toEqual([fake.id('hero'), fake.id('gallery')])
  })

  it('ignores a press that started on a control in the overlay layer', () => {
    const fake = build()

    renderCanvas(fake)
    pointAt('hero')

    const control = document.createElement('button')

    control.setAttribute('data-overlay-control', '')
    screen.getByTestId('canvas-overlays').append(control)
    fireEvent.pointerDown(control, { button: 0, bubbles: true, clientX: 40, clientY: 40 })

    expect(fake.scene.selectedIds()).toEqual([])
  })

  it('adds with Shift and toggles with the modifier key', () => {
    const fake = build()

    renderCanvas(fake)
    pointAt('heading')
    press()
    pointAt('gallery')
    press({ shiftKey: true })

    expect(fake.scene.selectedIds()).toEqual([fake.id('hero'), fake.id('gallery')])

    press({ metaKey: true })

    expect(fake.scene.selectedIds()).toEqual([fake.id('hero')])
    expect(fake.modes).toEqual(['replace', 'add', 'toggle'])
  })

  it('takes the deepest node with Alt', () => {
    const fake = build()

    renderCanvas(fake)
    pointAt('heading')
    press({ altKey: true })

    expect(fake.scene.selectedIds()).toEqual([fake.id('heading')])
  })

  it('does not select through a locked container', () => {
    const fake = build()

    renderCanvas(fake)
    pointAt('logo')
    press()

    expect(fake.scene.selectedIds()).toEqual([])
  })

  it('clears and starts a marquee on empty space', () => {
    const fake = build()

    renderCanvas(fake)
    pointAt('heading')
    press()
    pointAt(null)
    press()

    expect(fake.scene.selectedIds()).toEqual([])
    expect(screen.getByTestId('canvas-root')).toHaveAttribute('data-marquee', 'true')
    expect(screen.getByTestId('canvas-marquee')).toHaveAttribute('data-active', 'true')
  })

  it('ignores the middle button and a held space, which both belong to the pan', () => {
    const fake = build()

    renderCanvas(fake)
    pointAt('heading')
    press({ button: 1 })

    expect(fake.scene.selectedIds()).toEqual([])

    screen.getByTestId('canvas-root').dataset['panMode'] = 'true'
    press()

    expect(fake.scene.selectedIds()).toEqual([])
  })

  it('enters the container on a double click and takes what is under the cursor', () => {
    const fake = build()

    renderCanvas(fake)
    pointAt('heading')
    fireEvent.dblClick(screen.getByTestId('canvas-root'), { clientX: 40, clientY: 40 })

    expect(fake.scene.isolationId()).toBe(fake.id('hero'))
    expect(fake.scene.selectedIds()).toEqual([fake.id('heading')])
  })

  it('does not enter a container with no children', () => {
    const fake = build()

    renderCanvas(fake)
    pointAt('gallery')
    fireEvent.dblClick(screen.getByTestId('canvas-root'), { clientX: 40, clientY: 40 })

    expect(fake.scene.isolationId()).toBeNull()
  })

  it('does nothing when the double click lands on empty space', () => {
    const fake = build()

    renderCanvas(fake)
    pointAt(null)
    fireEvent.dblClick(screen.getByTestId('canvas-root'), { clientX: 40, clientY: 40 })

    expect(fake.scene.isolationId()).toBeNull()
  })

  it('announces the selection it just made', () => {
    const fake = build()

    renderCanvas(fake)
    pointAt('heading')
    press()

    act(() => {
      vi.advanceTimersByTime(ANNOUNCE_DEBOUNCE_MS)
    })

    expect(screen.getByRole('status')).toHaveTextContent('Hero selected. 1 of 3 in Page.')
  })
})
