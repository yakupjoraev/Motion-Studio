'use client'

import type { NodeId } from '@motion-studio/schema'
import { useRef } from 'react'

import { shouldFlipChip, writeBox } from './overlay-box'
import { OVERLAY_BOX_STYLE, SELECTION_CHIP_CLASS, SELECTION_OUTLINE_CLASS } from './overlay.styles'
import type { OverlayPainter } from './overlay.types'
import { useOverlayPaint } from './use-overlay-rects'

export interface SelectionOutlineProps {
  readonly id: NodeId
  readonly name: string
  readonly painter: OverlayPainter
  /** One node selected: full weight, with the name chip. A member of a set gets the thin outline. */
  readonly primary: boolean
}

/**
 * A sibling of the node, never a wrapper around it. Wrapping would put an editor element inside the
 * layout tree — changing what the node's parent lays out, and what the export printer has to emit —
 * so the outline is drawn over the node's measured box from the overlay layer instead.
 */
export function SelectionOutline({ id, name, painter, primary }: SelectionOutlineProps) {
  const box = useRef<HTMLDivElement | null>(null)
  const chip = useRef<HTMLSpanElement | null>(null)

  useOverlayPaint(painter, (frame) => {
    const rect = frame.rect(id)

    if (!writeBox(box.current, rect) || rect === undefined || chip.current === null) {
      return
    }

    chip.current.dataset['flipped'] = String(shouldFlipChip(rect, frame.transform))
  })

  return (
    <div
      aria-hidden
      className={SELECTION_OUTLINE_CLASS}
      data-member={String(!primary)}
      data-testid={`selection-outline-${id}`}
      ref={box}
      style={OVERLAY_BOX_STYLE}
    >
      {primary && (
        <span className={SELECTION_CHIP_CLASS} data-testid="selection-chip" ref={chip}>
          {name}
        </span>
      )}
    </div>
  )
}
