'use client'

import { useEffect, useState } from 'react'

import { useLanding } from '../../../lib/i18n/surfaces'
import { useInView } from '../use-in-view'

import { WalkthroughBand } from './walkthrough-band'
import { WalkthroughPair, WalkthroughRows, WalkthroughSubject } from './walkthrough-panel'
import { STEPS } from './walkthrough-steps'

export interface WalkthroughLiveProps {
  readonly note: string
}

/**
 * One row on or off. Fast enough that a reader sees the stack build rather than waits for it: eight
 * rows at 420 ms is a 3.4 s pass in each direction, and the subject's own transition is 260 ms, so
 * each row's change is finished before the next one lands.
 */
const STEP_MS = 420

/** The pause at each end of the pass, so the full stack and the bare subject are both legible. */
const HOLD_MS = 900

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * The stack goes on one row at a time, and then comes off the same way.
 *
 * The band used to scrub one value with the scroll, which made the claim depend on the reader
 * scrolling at the right speed and showed one property changing. The inspector's actual job is a
 * stack: properties and presets land on a subject in order, each one visible as it lands, and the
 * subject goes back to what it was when they come off. That is what this cycles through.
 *
 * `setInterval` at 900 ms rather than a frame loop: what changes is one integer per step, and the
 * movement itself is a CSS transition on the subject — no per-frame JavaScript and no re-render on the
 * frames that matter. Under reduced motion the cycle never starts and the designed pair renders
 * instead, which is the same alternative the server sends.
 */
export function WalkthroughLive({ note }: WalkthroughLiveProps) {
  const { inspector } = useLanding()
  const { ref, seen } = useInView()
  const [applied, setApplied] = useState(0)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    setReduced(prefersReducedMotion())
  }, [])

  useEffect(() => {
    if (!seen || reduced) {
      return
    }

    let cancelled = false
    let current = 0
    let direction = 1
    let timer = 0

    const tick = (): void => {
      if (cancelled) {
        return
      }

      current += direction

      // Both ends of the pass are held, so the bare subject and the full stack are both legible.
      const atEnd = current >= STEPS.length || current <= 0

      if (current >= STEPS.length) {
        current = STEPS.length
        direction = -1
      } else if (current <= 0) {
        current = 0
        direction = 1
      }

      setApplied(current)
      timer = window.setTimeout(tick, atEnd ? HOLD_MS : STEP_MS)
    }

    timer = window.setTimeout(tick, HOLD_MS)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [reduced, seen])

  const labels = {
    panelTitle: inspector.panelTitle,
    card: inspector.card,
    stepRadius: inspector.stepRadius,
    stepBorder: inspector.stepBorder,
    stepFlip: inspector.stepFlip,
    stepScale: inspector.stepScale,
    stepFloat: inspector.stepFloat,
    stepOrbit: inspector.stepOrbit,
    stepLift: inspector.stepLift,
    stepGlow: inspector.stepGlow,
  }

  return (
    <div ref={ref}>
      <WalkthroughBand
        note={note}
        rows={<WalkthroughRows applied={reduced ? STEPS.length : applied} labels={labels} />}
        subject={
          reduced ? (
            <WalkthroughPair after={inspector.after} before={inspector.before} labels={labels} />
          ) : (
            <WalkthroughSubject
              applied={applied}
              caption={inspector.applied
                .replace('{applied}', String(applied))
                .replace('{total}', String(STEPS.length))}
              labels={labels}
            />
          )
        }
      />
    </div>
  )
}
