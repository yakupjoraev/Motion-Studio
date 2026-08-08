import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { FpsMeter } from './fps-meter'

/** A frame clock the test drives, so a sampler that averages 30 frames can be checked in one tick. */
const stubFrameClock = () => {
  let now = 0
  const callbacks: ((time: number) => void)[] = []

  vi.stubGlobal('performance', { now: () => now })
  vi.stubGlobal('requestAnimationFrame', (callback: (time: number) => void) => {
    callbacks.push(callback)

    return callbacks.length
  })
  vi.stubGlobal('cancelAnimationFrame', () => undefined)

  return (frames: number, msPerFrame: number): void => {
    for (let index = 0; index < frames; index += 1) {
      const next = callbacks.shift()

      now += msPerFrame
      act(() => next?.(now))
    }
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('FpsMeter', () => {
  it('reads em dash until it has measured anything', () => {
    stubFrameClock()
    render(<FpsMeter />)

    expect(screen.getByText('— fps')).toBeInTheDocument()
  })

  it('reports 60 fps for 16.67 ms frames', () => {
    const advance = stubFrameClock()

    render(<FpsMeter />)
    advance(30, 1000 / 60)

    expect(screen.getByText('60 fps')).toBeInTheDocument()
  })

  it('reports the rolling average, so a recovered stall stops showing', () => {
    const advance = stubFrameClock()

    render(<FpsMeter />)
    advance(30, 50)

    expect(screen.getByText('20 fps')).toBeInTheDocument()

    // 30 fast frames is exactly the window, so the slow ones have all been shifted out.
    advance(30, 1000 / 60)

    expect(screen.getByText('60 fps')).toBeInTheDocument()
  })
})
