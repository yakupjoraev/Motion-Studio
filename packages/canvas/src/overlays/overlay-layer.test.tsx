import { act, fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { layoutNodes, pointAt, renderCanvas } from '../test/harness'
import { stubGestureEnvironment } from '../test/pointer'
import { type FakeScene, fakeScene } from '../test/scene'

import { OVERLAY_VARS } from './overlay.styles'

const box = (x: number, y: number, width: number, height: number) => ({
  x,
  y,
  width,
  height,
  top: y,
  left: x,
  right: x + width,
  bottom: y + height,
})

const frames = (count = 4): void => {
  act(() => {
    for (let step = 0; step < count; step += 1) {
      vi.advanceTimersToNextFrame()
    }
  })
}

const scene = (): FakeScene =>
  fakeScene({
    root: { children: ['hero', 'card'] },
    hero: { name: 'Hero', padding: { base: 8, lg: 24 }, margin: { base: 0 } },
    card: { name: 'Card' },
  })

const vars = (element: HTMLElement) => ({
  x: element.style.getPropertyValue(OVERLAY_VARS.x),
  y: element.style.getPropertyValue(OVERLAY_VARS.y),
  width: element.style.getPropertyValue(OVERLAY_VARS.width),
  height: element.style.getPropertyValue(OVERLAY_VARS.height),
})

const DEFAULT_LAYOUT = { hero: box(100, 200, 300, 50), card: box(500, 260, 100, 40) }

/** Mounts the canvas, gives the two nodes a box, and runs the cache pass and the paint after it. */
const mount = (
  fake: FakeScene,
  props: Parameters<typeof renderCanvas>[1] = {},
  layout: Record<string, ReturnType<typeof box>> = DEFAULT_LAYOUT,
) => {
  const view = renderCanvas(fake, props)

  layoutNodes(layout)
  frames()

  return view
}

beforeEach(() => {
  vi.useFakeTimers()
  stubGestureEnvironment()
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('OverlayLayer', () => {
  it('draws one outline over the selected node, in canvas units', () => {
    const fake = scene()

    mount(fake)

    act(() => fake.setSelection([fake.id('hero')]))
    frames()

    const outline = screen.getByTestId(`selection-outline-${fake.id('hero')}`)

    expect(outline).toHaveAttribute('data-active', 'true')
    expect(vars(outline)).toEqual({ x: '100px', y: '200px', width: '300px', height: '50px' })
  })

  it('names the node in a chip, and only when it is the one selected', () => {
    const fake = scene()

    mount(fake)

    act(() => fake.setSelection([fake.id('hero')]))
    frames()

    expect(screen.getByTestId('selection-chip')).toHaveTextContent('Hero')

    act(() => fake.setSelection([fake.id('hero'), fake.id('card')]))
    frames()

    expect(screen.queryByTestId('selection-chip')).not.toBeInTheDocument()
  })

  it('keeps the chip above its box when there is room for it', () => {
    const fake = scene()

    mount(fake)

    act(() => fake.setSelection([fake.id('hero')]))
    frames()

    expect(screen.getByTestId('selection-chip').dataset['flipped']).toBe('false')
  })

  it('flips the chip below the box when the box top reaches the viewport top', () => {
    const fake = scene()

    mount(fake, {}, { hero: box(100, 4, 300, 50) })

    act(() => fake.setSelection([fake.id('hero')]))
    frames()

    expect(screen.getByTestId('selection-chip').dataset['flipped']).toBe('true')
  })

  it('adds the dashed union box and thins the outlines for a multi-selection', () => {
    const fake = scene()

    mount(fake)

    act(() => fake.setSelection([fake.id('hero'), fake.id('card')]))
    frames()

    const union = screen.getByTestId('multi-selection-box')

    // hero 100–400 × 200–250, card 500–600 × 260–300.
    expect(vars(union)).toEqual({ x: '100px', y: '200px', width: '500px', height: '100px' })
    expect(screen.getByTestId(`selection-outline-${fake.id('hero')}`)).toHaveAttribute(
      'data-member',
      'true',
    )
  })

  it('keeps the union box out of the layer when one node is selected', () => {
    const fake = scene()

    mount(fake)

    act(() => fake.setSelection([fake.id('hero')]))
    frames()

    expect(screen.queryByTestId('multi-selection-box')).not.toBeInTheDocument()
  })

  it('outlines the hovered node, and drops it while a gesture owns the pointer', () => {
    const fake = scene()

    mount(fake)

    pointAt('card')
    fireEvent.pointerMove(screen.getByTestId('canvas-root'), { clientX: 520, clientY: 270 })
    frames()

    const hover = screen.getByTestId('hover-outline')

    expect(vars(hover)).toEqual({ x: '500px', y: '260px', width: '100px', height: '40px' })

    screen.getByTestId('canvas-root').dataset['marquee'] = 'true'
    fireEvent.pointerMove(screen.getByTestId('canvas-root'), { clientX: 521, clientY: 271 })
    frames()

    expect(hover).not.toHaveAttribute('data-active')
  })

  it('frames the artboard and names the breakpoint beside its width', () => {
    const fake = scene()

    mount(fake, { artboardWidth: 768, breakpointName: 'md' })

    expect(screen.getByTestId('breakpoint-label')).toHaveTextContent('md · 768')
    expect(screen.getByTestId('breakpoint-frame')).toHaveAttribute('data-active', 'true')
  })

  it('shows padding and margin on Alt, with the numbers the host resolved', () => {
    const fake = scene()

    mount(fake)

    act(() => fake.setSelection([fake.id('hero')]))
    frames()

    expect(screen.queryByTestId(`spacing-overlay-${fake.id('hero')}`)).not.toBeInTheDocument()

    act(() => {
      fireEvent.keyDown(window, { key: 'Alt', altKey: true })
    })
    frames()

    expect(screen.getByTestId('spacing-padding-top')).toHaveTextContent('8')
    // ADR-099: an override at the current breakpoint is what the overlay reports.
    act(() => fake.setBreakpoint('lg'))
    frames()

    expect(screen.getByTestId('spacing-padding-left')).toHaveTextContent('24')
    // A side with no value is hidden rather than labelled zero.
    expect(screen.getByTestId('spacing-margin-top').dataset['zero']).toBe('true')
  })

  it('drops the spacing overlay when Alt is released', () => {
    const fake = scene()

    mount(fake)

    act(() => fake.setSelection([fake.id('hero')]))
    act(() => {
      fireEvent.keyDown(window, { key: 'Alt', altKey: true })
    })
    frames()

    expect(screen.getByTestId(`spacing-overlay-${fake.id('hero')}`)).toBeInTheDocument()

    act(() => {
      fireEvent.keyUp(window, { key: 'Alt', altKey: false })
    })

    expect(screen.queryByTestId(`spacing-overlay-${fake.id('hero')}`)).not.toBeInTheDocument()
  })

  it('renders no node again while the canvas pans with a selection', () => {
    const fake = scene()
    const renderNode = vi.fn((id: string) => <div data-node-id={id} />)

    renderCanvas(fake, { renderNode: renderNode as never })
    layoutNodes({ hero: box(100, 200, 300, 50) })
    frames()

    act(() => fake.setSelection([fake.id('hero'), fake.id('card')]))
    frames()

    const before = renderNode.mock.calls.length
    const root = screen.getByTestId('canvas-root')

    fireEvent.pointerDown(root, { button: 1, pointerId: 1 })

    for (let step = 0; step < 60; step += 1) {
      fireEvent.pointerMove(root, { pointerId: 1, movementX: 4, movementY: 2 })
      frames(1)
    }

    fireEvent.pointerUp(root, { pointerId: 1 })

    expect(renderNode.mock.calls.length - before).toBe(0)
  })

  it('leaves the overlay geometry alone while only the transform moves', () => {
    const fake = scene()

    mount(fake)

    act(() => fake.setSelection([fake.id('hero')]))
    frames()

    const outline = screen.getByTestId(`selection-outline-${fake.id('hero')}`)
    const before = vars(outline)
    const root = screen.getByTestId('canvas-root')

    fireEvent.pointerDown(root, { button: 1, pointerId: 1 })
    fireEvent.pointerMove(root, { pointerId: 1, movementX: 40, movementY: 20 })
    frames()

    // ADR-091: the box is in canvas units, so a pan moves the overlay through `calc()` and not here.
    expect(vars(outline)).toEqual(before)
  })
})
