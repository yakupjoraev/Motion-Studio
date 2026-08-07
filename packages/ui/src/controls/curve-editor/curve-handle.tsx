import { round } from '@motion-studio/utils'
import type { ReactElement } from 'react'

export interface CurveHandleProps {
  readonly name: string
  readonly x: number
  readonly y: number
  readonly disabled: boolean
  readonly onChange: (x: number, y: number, commit: boolean) => void
}

/** X is bounded to the unit interval by the cubic-bézier grammar; Y may overshoot, and often should. */
const BOUNDS = {
  x: { min: 0, max: 1 },
  y: { min: -1, max: 2 },
} as const

const STEP = 0.01

/**
 * One control point, as two range inputs — the pattern React Aria's colour area uses for the same
 * problem: a two-dimensional value has no single ARIA role, and two sliders give a keyboard user an axis
 * each, both announcing their own number. The visible dot is drawn by the editor around them.
 */
export function CurveHandle({ name, x, y, disabled, onChange }: CurveHandleProps): ReactElement {
  return (
    <span className="sr-only">
      <input
        type="range"
        aria-label={`${name} X`}
        aria-valuetext={`${name} X ${round(x, 2)}`}
        min={BOUNDS.x.min}
        max={BOUNDS.x.max}
        step={STEP}
        value={x}
        disabled={disabled}
        onChange={(event) => onChange(Number.parseFloat(event.target.value), y, true)}
      />
      <input
        type="range"
        aria-label={`${name} Y`}
        aria-valuetext={`${name} Y ${round(y, 2)}`}
        min={BOUNDS.y.min}
        max={BOUNDS.y.max}
        step={STEP}
        value={y}
        disabled={disabled}
        onChange={(event) => onChange(x, Number.parseFloat(event.target.value), true)}
      />
    </span>
  )
}
