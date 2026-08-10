'use client'

import { FILL_CLASS, INDICATOR_BOX_STYLE } from './indicator.styles'

export interface FillIndicatorProps {
  /** The handle's `attach`: the element registers itself with what moves it. */
  readonly attach: (element: HTMLElement | null) => void
}

/** Into an empty container: there is no edge to draw, so the container itself is the answer. */
export function FillIndicator({ attach }: FillIndicatorProps) {
  return (
    <div
      aria-hidden
      className={FILL_CLASS}
      data-testid="drop-fill"
      ref={attach}
      style={INDICATOR_BOX_STYLE}
    />
  )
}
