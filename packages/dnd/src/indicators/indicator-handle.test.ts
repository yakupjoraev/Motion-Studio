import { describe, expect, it, vi } from 'vitest'

import type { DropIndicator } from '../dnd.types'
import { createIndicatorHandle } from './indicator-handle'
import { INDICATOR_VARS } from './indicator.styles'

const line = (y: number): DropIndicator => ({
  kind: 'line',
  axis: 'y',
  rect: { x: 0, y, width: 400, height: 2 },
})

const reject = (reason: string): DropIndicator => ({
  kind: 'reject',
  rect: { x: 0, y: 0, width: 10, height: 10 },
  reason,
})

const element = (): HTMLElement => document.createElement('div')

describe('createIndicatorHandle', () => {
  it('writes the rect straight onto the element', () => {
    const handle = createIndicatorHandle()
    const box = element()

    handle.attach(box)
    handle.set(line(120))

    expect(box.style.getPropertyValue(INDICATOR_VARS.x)).toBe('0px')
    expect(box.style.getPropertyValue(INDICATOR_VARS.y)).toBe('120px')
    expect(box.style.getPropertyValue(INDICATOR_VARS.width)).toBe('400px')
    expect(box.style.getPropertyValue(INDICATOR_VARS.height)).toBe('2px')
  })

  it('paints an element that arrives after the geometry did', () => {
    const handle = createIndicatorHandle()
    const box = element()

    handle.set(line(80))
    handle.attach(box)

    expect(box.style.getPropertyValue(INDICATOR_VARS.y)).toBe('80px')
  })

  it('does not notify while only the position changes', () => {
    const handle = createIndicatorHandle()
    const listener = vi.fn()

    handle.subscribe(listener)
    handle.set(line(10))
    expect(listener).toHaveBeenCalledTimes(1)

    handle.set(line(20))
    handle.set(line(30))

    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('notifies when the kind changes', () => {
    const handle = createIndicatorHandle()
    const listener = vi.fn()

    handle.subscribe(listener)
    handle.set(line(10))
    handle.set({ kind: 'fill', rect: { x: 0, y: 0, width: 10, height: 10 } })

    expect(listener).toHaveBeenCalledTimes(2)
    expect(handle.kind()).toBe('fill')
  })

  it('notifies when the same rejection becomes a different one', () => {
    const handle = createIndicatorHandle()
    const listener = vi.fn()

    handle.subscribe(listener)
    handle.set(reject('Layer is locked'))
    handle.set(reject('Cannot drop into itself'))

    expect(listener).toHaveBeenCalledTimes(2)
    expect(handle.reason()).toBe('Cannot drop into itself')
  })

  it('clears to nothing at the end of a drag', () => {
    const handle = createIndicatorHandle()

    handle.set(line(10))
    handle.set(null)

    expect(handle.kind()).toBe('none')
    expect(handle.rect()).toBeNull()
  })

  it('stops notifying an unsubscribed listener', () => {
    const handle = createIndicatorHandle()
    const listener = vi.fn()
    const off = handle.subscribe(listener)

    off()
    handle.set(line(10))

    expect(listener).not.toHaveBeenCalled()
  })

  it('survives a set with nothing attached', () => {
    const handle = createIndicatorHandle()

    expect(() => {
      handle.set(line(10))
      handle.attach(null)
    }).not.toThrow()
  })
})
