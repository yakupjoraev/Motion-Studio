'use client'

import { type KeyboardEvent, type PointerEvent, type ReactElement, useCallback } from 'react'

import type { Bezier } from './bezier'

/** Arrows move a control point by 0.01, `Shift` by 0.05 — PLAYGROUND.md § Accessibility. */
export const BEZIER_STEP = 0.01
export const BEZIER_STEP_LARGE = 0.05

export interface ControlPointProps {
  readonly index: 1 | 2
  readonly x: number
  readonly y: number
  readonly size: number
  readonly curve: Bezier
  onGrab: (index: 1 | 2, event: PointerEvent<HTMLButtonElement>) => void
  onNudge: (index: 1 | 2, dx: number, dy: number) => void
}

export function ControlPoint({
  index,
  x,
  y,
  size,
  curve,
  onGrab,
  onNudge,
}: ControlPointProps): ReactElement {
  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      const step = event.shiftKey ? BEZIER_STEP_LARGE : BEZIER_STEP
      const moves: Readonly<Record<string, readonly [number, number]>> = {
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
        ArrowUp: [0, step],
        ArrowDown: [0, -step],
      }
      const move = moves[event.key]

      if (move !== undefined) {
        event.preventDefault()
        onNudge(index, move[0], move[1])
      }
    },
    [index, onNudge],
  )

  return (
    <button
      type="button"
      data-testid={`bezier-point-${index}`}
      aria-label={`Control point ${index}, curve ${curve.x1}, ${curve.y1}, ${curve.x2}, ${curve.y2}`}
      onPointerDown={(event) => onGrab(index, event)}
      onKeyDown={onKeyDown}
      style={{ left: x * size, top: (1 - y) * size }}
      className="-translate-x-1/2 -translate-y-1/2 absolute size-5 touch-none rounded-full border-2 border-white bg-accent focus-visible:outline-2 focus-visible:outline-accent-ring focus-visible:outline-offset-2"
    />
  )
}
