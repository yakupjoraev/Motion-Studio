import { StatDelta } from './stat-delta'
import { StatSparkline } from './stat-sparkline'
import { deltaTone } from './stat.schema'
import { STAT_LABEL, statStyles, statValueStyles } from './stat.styles'
import type { StatProps } from './stat.types'

/** A figure, its label, an optional change, and an optional sparkline. */
export function Stat({
  value,
  label,
  delta,
  deltaDirection,
  deltaRose,
  series,
  showSparkline,
  size,
  align,
  hidden,
}: StatProps) {
  const tone = deltaTone(deltaDirection, deltaRose)

  return (
    <div className={statStyles({ align, hidden })}>
      <p className={statValueStyles({ size })} data-testid="stat-value">
        {value}
      </p>

      {label !== '' && <p className={STAT_LABEL}>{label}</p>}

      <StatDelta label={delta} rose={deltaRose} tone={tone} />

      {showSparkline && <StatSparkline tone={tone} values={series} />}
    </div>
  )
}
