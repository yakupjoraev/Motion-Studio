'use client'

import { type ReactElement, useEffect, useRef } from 'react'

import { type Bezier, toCssString } from './bezier'

export interface BezierPreviewProps {
  readonly curve: Bezier
  readonly duration: number
  readonly reduced: boolean
}

/**
 * A dot travelling on the curve under edit. It is the answer to "what does 1.56 overshoot feel like",
 * which the four numbers and the drawn line both fail to give.
 *
 * A replay is a remount: the parent keys this component, so "run it again" is one number rather
 * than an effect that has to be told it changed.
 *
 * The Web Animations API rather than a CSS transition: the curve is a string that changes on every
 * drag, and re-running an animation is one call where re-triggering a transition is a reflow dance.
 */
export function BezierPreview({ curve, duration, reduced }: BezierPreviewProps): ReactElement {
  const dot = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const element = dot.current

    if (element === null || reduced || typeof element.animate !== 'function') {
      return
    }

    /* `left` in percent resolves against the track, which is the distance the reader is watching. */
    const animation = element.animate([{ left: '0.25rem' }, { left: 'calc(100% - 1.75rem)' }], {
      duration,
      easing: toCssString(curve),
      fill: 'forwards',
    })

    return () => animation.cancel()
  }, [curve, duration, reduced])

  return (
    <div
      className="relative h-8 w-full overflow-hidden rounded-full border border-border bg-surface-2"
      data-testid="bezier-preview"
    >
      <div
        ref={dot}
        aria-hidden="true"
        className="absolute top-1 left-1 size-6 rounded-full bg-[linear-gradient(140deg,oklch(62%_0.19_285),oklch(72%_0.16_200))]"
      />
    </div>
  )
}
