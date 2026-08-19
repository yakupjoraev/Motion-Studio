import type { RingSize } from './progress-ring.schema'
import { RING_UNIT, ringReadoutStyles } from './progress-ring.styles'

export interface RingReadoutProps {
  readonly value: number
  readonly unit: string
  readonly size: RingSize
}

/**
 * The figure in the middle.
 *
 * It shows the **value**, not the percentage the arc draws: on a range that is a count, "42 of 62" is 68 %
 * and a readout saying 68 would be a number the reader cannot find anywhere in the data.
 *
 * `aria-hidden`, because `aria-valuetext` on the progressbar around it is the announcement: a reader that
 * heard both would be told the number twice, once with the unit and once without.
 */
export function RingReadout({ value, unit, size }: RingReadoutProps) {
  return (
    <p aria-hidden="true" className={ringReadoutStyles({ size })} data-testid="ring-readout">
      <span>
        {value}
        {unit !== '' && <span className={RING_UNIT}>{unit}</span>}
      </span>
    </p>
  )
}
