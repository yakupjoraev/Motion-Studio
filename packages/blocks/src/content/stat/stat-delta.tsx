import { statDeltaStyles } from './stat.styles'

/** The arrow is the second signal beside colour, so the direction survives greyscale. */
const ARROWS = { up: '↑', down: '↓' } as const

export interface StatDeltaProps {
  readonly label: string
  readonly rose: boolean
  readonly tone: 'positive' | 'negative' | 'neutral'
}

export function StatDelta({ label, rose, tone }: StatDeltaProps) {
  if (label === '') {
    return null
  }

  return (
    <span className={statDeltaStyles({ tone })} data-testid="stat-delta">
      <span aria-hidden="true">{ARROWS[rose ? 'up' : 'down']}</span>
      {label}
    </span>
  )
}
