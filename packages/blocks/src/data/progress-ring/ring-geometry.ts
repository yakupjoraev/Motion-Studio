/**
 * The ring, as a pure function. No chart library and no measurement: the viewBox is fixed and the arc is a
 * `stroke-dasharray` / `stroke-dashoffset` pair on one circle, so the SVG scales with its container and no
 * number ever reaches the DOM as a size.
 *
 * Coordinates are rounded to two decimals for the reason `content/stat`'s sparkline gives: an unrounded
 * value differs between machines in its last digit, which would make the thumbnail generator's
 * byte-for-byte comparison fail for a reason that has nothing to do with the picture.
 */
export const RING_VIEWBOX = 120
export const RING_RADIUS = 52
export const RING_CENTRE = RING_VIEWBOX / 2

const round = (value: number): number => Math.round(value * 100) / 100

export const RING_CIRCUMFERENCE = round(2 * Math.PI * RING_RADIUS)

export interface RingGeometry {
  /** Where the value sits in its range, 0 to 1. */
  readonly fraction: number
  /** The same thing as a whole percentage, which is what the readout and `aria-valuetext` say. */
  readonly percent: number
  /** How much of the circumference is left undrawn. */
  readonly offset: number
}

export function ringGeometry(value: number, min: number, max: number): RingGeometry {
  // A range with no width has no fraction to report. Empty rather than full: a ring that read 100 % because
  // its bounds were misconfigured would announce a finished task that never started.
  const span = max - min
  const fraction = span <= 0 ? 0 : Math.min(1, Math.max(0, (value - min) / span))

  return {
    fraction: round(fraction),
    percent: Math.round(fraction * 100),
    offset: round(RING_CIRCUMFERENCE * (1 - fraction)),
  }
}

/**
 * What a screen reader is told when the author has not written it. `aria-valuenow` alone leaves the
 * announcement to the platform's own arithmetic, and on a range that is not 0–100 that arithmetic reports a
 * percentage the visible readout does not show.
 */
export const ringValueText = (percent: number): string => `${percent} percent complete`
