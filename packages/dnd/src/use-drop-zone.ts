'use client'

import { useDroppable } from '@dnd-kit/core'
import { useMemo } from 'react'

import type { DropZone } from './dnd.types'

export interface DropZoneOptions extends DropZone {
  /** A locked or hidden parent is still a zone: it rejects with a reason instead of vanishing. */
  readonly disabled?: boolean
}

/**
 * A node can own more than one slot, and both surfaces register a zone for the same node — so the
 * identity is the surface, the node and the slot (ADR-181). Without the surface the canvas and the
 * tree would register one droppable under one id and dnd-kit would keep whichever mounted last.
 */
export const dropZoneId = (surface: string, parentId: string, slot: string): string =>
  `${surface}:${parentId}/${slot}`

export function useDropZone({ disabled = false, ...zone }: DropZoneOptions) {
  const data = useMemo<DropZone>(
    () => ({
      parentId: zone.parentId,
      slot: zone.slot,
      orientation: zone.orientation,
      label: zone.label,
      childIds: zone.childIds,
      surface: zone.surface,
    }),
    [zone.parentId, zone.slot, zone.orientation, zone.label, zone.childIds, zone.surface],
  )

  const { isOver, setNodeRef } = useDroppable({
    id: dropZoneId(zone.surface, zone.parentId, zone.slot),
    data,
    disabled,
  })

  return { isOver, ref: setNodeRef }
}
