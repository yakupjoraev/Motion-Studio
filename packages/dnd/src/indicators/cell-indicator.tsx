'use client'

import { CELL_CLASS, INDICATOR_BOX_STYLE } from './indicator.styles'

export interface CellIndicatorProps {
  /** The handle's `attach`: the element registers itself with what moves it. */
  readonly attach: (element: HTMLElement | null) => void
}

/** In a grid: the cell the block would take, including the one that does not exist yet. */
export function CellIndicator({ attach }: CellIndicatorProps) {
  return (
    <div
      aria-hidden
      className={CELL_CLASS}
      data-testid="drop-cell"
      ref={attach}
      style={INDICATOR_BOX_STYLE}
    />
  )
}
