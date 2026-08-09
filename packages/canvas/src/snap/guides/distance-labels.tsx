'use client'

import {
  GAP_BAR_CLASS,
  GAP_CAP_END_CLASS,
  GAP_CAP_START_CLASS,
  GAP_LABEL_CLASS,
} from '../snap.styles'

import { GAP_VARS, type SnapOverlay } from './paint-guides'

export interface DistanceLabelsProps {
  readonly overlay: SnapOverlay
}

/**
 * The measurement a spacing snap fires with: a bar across each gap, capped at both ends, with the
 * distance in canvas units at its midpoint — CANVAS.md § Guides. Four slots is the pool, since one
 * snap per axis measures two gaps.
 */
export function DistanceLabels({ overlay }: DistanceLabelsProps) {
  return (
    <>
      {overlay.gaps.map((slot) => (
        <div
          aria-hidden
          className={GAP_BAR_CLASS}
          data-testid={`snap-gap-${slot.id}`}
          key={slot.id}
          ref={slot.bar}
          style={{
            left: `var(${GAP_VARS.x}, 0px)`,
            top: `var(${GAP_VARS.y}, 0px)`,
            width: `var(${GAP_VARS.width}, 0px)`,
            height: `var(${GAP_VARS.height}, 0px)`,
          }}
        >
          <span className={GAP_CAP_START_CLASS} />
          <span className={GAP_CAP_END_CLASS} />
          <span className={GAP_LABEL_CLASS} ref={slot.label} />
        </div>
      ))}
    </>
  )
}
