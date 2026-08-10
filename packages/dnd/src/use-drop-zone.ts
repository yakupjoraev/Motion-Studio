'use client'

import { useDroppable } from '@dnd-kit/core'
import { useMemo } from 'react'

import type { DropZone } from './dnd.types'

export interface DropZoneOptions extends DropZone {
  /** A locked or hidden parent is still a zone: it rejects with a reason instead of vanishing. */
  readonly disabled?: boolean
}

/** A node can own more than one slot, so the slot is part of the identity. */
export const dropZoneId = (parentId: string, slot: string): string => `${parentId}/${slot}`

export function useDropZone({ disabled = false, ...zone }: DropZoneOptions) {
  const data = useMemo<DropZone>(
    () => ({
      parentId: zone.parentId,
      slot: zone.slot,
      orientation: zone.orientation,
      label: zone.label,
      childIds: zone.childIds,
    }),
    [zone.parentId, zone.slot, zone.orientation, zone.label, zone.childIds],
  )

  const { isOver, setNodeRef } = useDroppable({
    id: dropZoneId(zone.parentId, zone.slot),
    data,
    disabled,
  })

  return { isOver, ref: setNodeRef }
}
