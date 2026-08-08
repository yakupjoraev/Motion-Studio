'use client'

import { useEffect, useRef } from 'react'

/** A rolling average over 30 frames: long enough to be readable, short enough to show a stall. */
const WINDOW = 30

/** Half a second at 60 Hz. Writing the text every frame would cost more than the meter measures. */
const WRITE_EVERY = 30

/**
 * A real sampler, not a number in the markup. The frame times never reach React — contract § 5 puts
 * high-frequency values in a ref and a direct DOM write, and a meter that re-rendered the status bar
 * sixty times a second would be measuring itself.
 */
export function FpsMeter() {
  const outputRef = useRef<HTMLSpanElement | null>(null)

  useEffect(() => {
    const samples: number[] = []
    let previous = performance.now()
    let sinceWrite = 0
    let frame = 0

    const tick = (now: number): void => {
      const delta = now - previous

      previous = now
      samples.push(delta)

      if (samples.length > WINDOW) {
        samples.shift()
      }

      sinceWrite += 1

      if (sinceWrite >= WRITE_EVERY && samples.length > 0) {
        sinceWrite = 0

        const mean = samples.reduce((total, value) => total + value, 0) / samples.length
        const fps = mean > 0 ? Math.round(1000 / mean) : 0

        if (outputRef.current !== null) {
          outputRef.current.textContent = `${fps} fps`
        }
      }

      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(frame)
  }, [])

  // A plain span, deliberately: `<output>` has an implicit `status` role, and a live region that
  // re-announces a number twice a second is unusable with a screen reader running.
  return (
    <span className="tabular-nums" ref={outputRef}>
      — fps
    </span>
  )
}
