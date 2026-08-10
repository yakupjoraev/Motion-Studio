'use client'

import { DragOverlay } from '@dnd-kit/core'
import { Z_INDEX } from '@motion-studio/tokens'

import type { DragPayload } from '../dnd.types'
import { snapToCursorOffset } from '../modifiers/snap-to-cursor-offset'
import { BlockCardPreview } from './block-card-preview'
import { NodeGhost } from './node-ghost'

const MODIFIERS = [snapToCursorOffset]

/** ADR-075's variable answers the media query, the token and the studio's own preview in one read. */
const reducedMotion = (): boolean =>
  getComputedStyle(document.documentElement).getPropertyValue('--ms-reduced-motion').trim() === '0'

/**
 * A keyboard drag jumps between positions, so dnd-kit eases the overlay between them; under reduced
 * motion it lands instead. A pointer drag never gets a transition — the ghost has to sit on the
 * cursor, and 250 ms of easing is 250 ms of lag.
 */
const transition = (activatorEvent: Event | null): string | undefined =>
  activatorEvent instanceof KeyboardEvent && !reducedMotion() ? 'transform 250ms ease' : undefined

export interface DndDragOverlayProps {
  readonly payload: DragPayload | null
}

/** `dropAnimation={null}`: a snap-back animation reads as failure, and every drop here is immediate. */
export function DndDragOverlay({ payload }: DndDragOverlayProps) {
  return (
    <DragOverlay
      dropAnimation={null}
      modifiers={MODIFIERS}
      transition={transition}
      zIndex={Z_INDEX.dragGhost}
    >
      {payload === null ? null : payload.kind === 'palette-block' ? (
        <BlockCardPreview label={payload.label} />
      ) : (
        <NodeGhost count={payload.nodeIds.length} labels={payload.labels} />
      )}
    </DragOverlay>
  )
}
