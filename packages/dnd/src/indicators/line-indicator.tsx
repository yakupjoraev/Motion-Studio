'use client'

import { INDICATOR_BOX_STYLE, LINE_CLASS } from './indicator.styles'

export interface LineIndicatorProps {
  /** The handle's `attach`: the element registers itself with what moves it. */
  readonly attach: (element: HTMLElement | null) => void
}

/** Between two siblings: a hairline on the edge the drop would open. */
export function LineIndicator({ attach }: LineIndicatorProps) {
  return (
    <div
      aria-hidden
      className={LINE_CLASS}
      data-testid="drop-line"
      ref={attach}
      style={INDICATOR_BOX_STYLE}
    />
  )
}
