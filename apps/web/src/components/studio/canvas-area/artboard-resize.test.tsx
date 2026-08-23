import { VIEWPORT_VARS } from '@motion-studio/canvas'
import { createEmptyDocument, nodeId } from '@motion-studio/schema'
import type { NodeId } from '@motion-studio/schema'
import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useStudioStore } from '../../../store/editor-store'

import { ToastProvider } from '@motion-studio/ui'
import { FIT_FALLBACK_MS } from './artboard-resize'
import { CanvasHost } from './canvas-host'

let counter = 0

const nextId = (): NodeId => {
  counter += 1

  return nodeId(`node_a${counter}`)
}

const state = () => useStudioStore.getState()

const zoom = (): number =>
  Number(screen.getByTestId('canvas-root').style.getPropertyValue(VIEWPORT_VARS.zoom))

/** A canvas 800 px wide: `base` and `md` fit inside it, `2xl` does not. */
const VIEWPORT = { left: 0, top: 0, width: 800, height: 600 }

/** The fallback timer, then the frame the fit's variable write is scheduled in. */
const settle = (): void => {
  act(() => {
    vi.advanceTimersByTime(FIT_FALLBACK_MS)
  })

  act(() => {
    vi.advanceTimersByTime(32)
  })
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    ...VIEWPORT,
    right: VIEWPORT.width,
    bottom: VIEWPORT.height,
    x: 0,
    y: 0,
    toJSON: () => VIEWPORT,
  })

  act(() => {
    state().replaceDocument(createEmptyDocument({ ids: () => nextId() }))
    state().setBreakpoint('base')

    if (state().viewport.multiFrame) {
      state().toggleMultiFrame()
    }
  })
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
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
describe('the artboard', () => {
  it('is the active breakpoint’s frame, and base is a phone — ADR-166', () => {
    render(<Host />)

    expect(screen.getByTestId('canvas-artboard')).toHaveStyle({ width: '375px' })

    act(() => state().setBreakpoint('lg'))

    expect(screen.getByTestId('canvas-artboard')).toHaveStyle({ width: '1024px' })
    expect(screen.getByTestId('breakpoint-frame')).toBeInTheDocument()
  })

  it('fits the frame back into view when the new one no longer fits', () => {
    render(<Host />)
    settle()

    expect(zoom()).toBe(1)

    act(() => state().setBreakpoint('2xl'))
    settle()

    // 1536 canvas units at 100 % is wider than the 800 px canvas, so the fit brings it back.
    expect(zoom()).toBeLessThan(1)
  })

  it('leaves the transform alone when the new frame still fits', () => {
    render(<Host />)
    settle()

    act(() => state().setBreakpoint('sm'))
    settle()

    expect(zoom()).toBe(1)
  })

  it('does not fit on the first render, whatever the document was opened at', () => {
    act(() => state().setBreakpoint('2xl'))

    render(<Host />)
    settle()

    // Opening a document must not move a transform it was saved with — only a switch does.
    expect(zoom()).toBe(1)
  })
})
