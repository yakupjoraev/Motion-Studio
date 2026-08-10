'use client'

import { useDraggable } from '@dnd-kit/core'
import type { BlockId } from '@motion-studio/schema'
import { useMemo } from 'react'

import type { DragPayload } from './dnd.types'

export interface DraggableBlockOptions {
  readonly blockId: BlockId
  /** ACCESSIBILITY.md § Block palette: the name a screen reader reads, category included. */
  readonly label: string
  readonly disabled?: boolean
}

export const draggableBlockId = (blockId: BlockId): string => `block:${blockId}`

/** The palette card end of operation 1: palette → canvas. */
export function useDraggableBlock({ blockId, label, disabled = false }: DraggableBlockOptions) {
  const data = useMemo<DragPayload>(
    () => ({ kind: 'palette-block', blockId, label }),
    [blockId, label],
  )

  const { attributes, isDragging, listeners, setNodeRef } = useDraggable({
    id: draggableBlockId(blockId),
    data,
    disabled,
    attributes: { roleDescription: 'draggable block' },
  })

  return { attributes, isDragging, listeners, ref: setNodeRef }
}
