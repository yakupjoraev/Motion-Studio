'use client'

import { GRID_CLASS } from '../canvas.styles'
import { VIEWPORT_VARS } from '../viewport/use-viewport'

export const GRID_SIZES = [4, 8, 16, 24] as const

export type GridSize = (typeof GRID_SIZES)[number]

/** CANVAS.md § Grid: 8 px dots. `Alt`+arrows nudge by this, so it is named rather than repeated. */
export const DEFAULT_GRID_SIZE: GridSize = 8

/** Every tenth cell is stronger, which is what makes a grid readable rather than a texture. */
const MAJOR_EVERY = 10

export interface GridProps {
  readonly size?: GridSize | undefined
}

/**
 * CANVAS.md § Grid. Two `radial-gradient`s as a background image on one element: zero children, zero
 * renders, and the sizes are canvas units, so the dots scale with the scene instead of being redrawn.
 *
 * Opacity comes from `--ms-vp-grid-opacity`, written beside the transform in the same frame, so the
 * fade between 25 % and 50 % zoom costs nothing either.
 */
export function Grid({ size = DEFAULT_GRID_SIZE }: GridProps) {
  const major = size * MAJOR_EVERY

  return (
    <div
      aria-hidden
      className={GRID_CLASS}
      data-testid="canvas-grid"
      style={{
        opacity: `var(${VIEWPORT_VARS.gridOpacity}, 1)`,
        backgroundImage: [
          'radial-gradient(circle, var(--ms-color-canvas-grid, rgb(255 255 255 / 0.16)) 1px, transparent 1px)',
          'radial-gradient(circle, var(--ms-color-canvas-grid-major, rgb(255 255 255 / 0.28)) 1.5px, transparent 1.5px)',
        ].join(', '),
        backgroundSize: `${size}px ${size}px, ${major}px ${major}px`,
      }}
    />
  )
}
