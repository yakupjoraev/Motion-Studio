import type { CSSProperties } from 'react'

import type { RingSize, RingWeight } from './progress-ring.schema'
import { RING_ARC, RING_STROKE, RING_TRACK, ringSvgStyles } from './progress-ring.styles'
import { RING_CENTRE, RING_CIRCUMFERENCE, RING_RADIUS, RING_VIEWBOX } from './ring-geometry'

export interface RingArcProps {
  readonly offset: number
  readonly size: RingSize
  readonly weight: RingWeight
}

/**
 * The two circles: the track, then the arc over it.
 *
 * `-rotate-90` on the SVG puts the arc's start at twelve o'clock, which is where progress starts. The readout
 * is a sibling of this element rather than a child, because rotating the SVG would rotate the figure with it.
 *
 * The two dynamic values travel as custom properties, which is the exemption COMPONENT_LIBRARY.md § Rules 3
 * grants and the same device `effectVars` uses: the class carries the technique, the variables carry the
 * value. `stroke-dashoffset` is declared on the element as the **final** state, so the keyframe in
 * `blocks.css` only has a `from` and a duration collapsed to zero leaves the ring reporting its value.
 */
export function RingArc({ offset, size, weight }: RingArcProps) {
  const stroke = RING_STROKE[weight]
  const vars: Record<string, string> = {
    '--ms-ring-length': String(RING_CIRCUMFERENCE),
    '--ms-ring-offset': String(offset),
  }

  return (
    <svg
      aria-hidden="true"
      className={ringSvgStyles({ size })}
      data-testid="ring-svg"
      fill="none"
      viewBox={`0 0 ${RING_VIEWBOX} ${RING_VIEWBOX}`}
    >
      <circle
        className={RING_TRACK}
        cx={RING_CENTRE}
        cy={RING_CENTRE}
        r={RING_RADIUS}
        stroke="currentColor"
        strokeWidth={stroke}
      />
      <circle
        className={RING_ARC}
        cx={RING_CENTRE}
        cy={RING_CENTRE}
        data-testid="ring-arc"
        r={RING_RADIUS}
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth={stroke}
        style={vars as CSSProperties}
      />
    </svg>
  )
}
