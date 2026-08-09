import { SPARKLINE_VIEWBOX, sparklinePath } from './sparkline'
import { statSparklineStyles } from './stat.styles'

export interface StatSparklineProps {
  readonly values: readonly number[]
  readonly tone: 'positive' | 'negative' | 'neutral'
}

/**
 * The sparkline. `aria-hidden` and carrying no numbers of its own: everything it shows is already the
 * value and the change beside it, so a screen reader gets the statistic once rather than a list of
 * coordinates. Renders nothing at all from a series too short to have a shape.
 */
export function StatSparkline({ values, tone }: StatSparklineProps) {
  const geometry = sparklinePath(values)

  if (geometry.line === '') {
    return null
  }

  return (
    <svg
      aria-hidden="true"
      className={statSparklineStyles({ tone })}
      data-testid="stat-sparkline"
      fill="none"
      preserveAspectRatio="none"
      viewBox={`0 0 ${SPARKLINE_VIEWBOX.width} ${SPARKLINE_VIEWBOX.height}`}
    >
      <path d={geometry.area} fill="currentColor" opacity="0.12" />
      <path
        d={geometry.line}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
