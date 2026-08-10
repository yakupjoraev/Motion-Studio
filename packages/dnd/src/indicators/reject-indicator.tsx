'use client'

import { INDICATOR_BOX_STYLE, REJECT_CLASS, REJECT_LABEL_CLASS } from './indicator.styles'

export interface RejectIndicatorProps {
  readonly attach: (element: HTMLElement | null) => void
  /** The sentence `validateDrop` produced. The announcer reads the same one. */
  readonly reason: string
}

/**
 * A refusal, said out loud before the release: a red outline on the container that will not take the
 * block, and the reason beside it. Dropping nothing silently is the worst feedback a builder can give.
 */
export function RejectIndicator({ attach, reason }: RejectIndicatorProps) {
  return (
    <div
      aria-hidden
      className={REJECT_CLASS}
      data-testid="drop-reject"
      ref={attach}
      style={INDICATOR_BOX_STYLE}
    >
      <span className={REJECT_LABEL_CLASS} data-testid="drop-reject-reason">
        {reason}
      </span>
    </div>
  )
}
