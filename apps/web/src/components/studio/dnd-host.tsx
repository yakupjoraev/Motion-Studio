'use client'

import { blockRegistry } from '@motion-studio/blocks/registry'
import {
  DndProvider,
  type DragPayload,
  type DropTarget,
  type DropTargetResolver,
  commandForDrop,
  draggedNodeIds,
  resolveDropTarget,
} from '@motion-studio/dnd'
import { DENSITY } from '@motion-studio/ui'
import { type ReactNode, useCallback } from 'react'

import { useStudioStore } from '../../store/editor-store'

import { layerRects } from './left-panel/layers/layer-rects'

export interface DndHostProps {
  readonly children: ReactNode
}

/** ADR-134: one press is one row, because the tree is the surface a drag starts on. */
const gridSize = (): number => DENSITY.layerRow
const zoom = (): number => 1

/**
 * DRAG_AND_DROP.md § Public API: the provider wraps the studio, and the four things it does not own
 * arrive here — the geometry, the resolver bound to this document, and the command a drop becomes.
 * The shell stays a room with no idea what a document is.
 */
export function DndHost({ children }: DndHostProps) {
  const resolveTarget = useCallback<DropTargetResolver>(({ payload, zone, point }) => {
    const state = useStudioStore.getState()

    return resolveDropTarget({
      point,
      // The collision already decided which container the pointer is in, by the geometry of ADR-133.
      hitNodeId: zone.parentId,
      draggedBlockId: payload.blockId,
      draggedNodeIds: draggedNodeIds(payload),
      document: state.document,
      registry: blockRegistry,
      rects: layerRects,
      isolationId: state.selection.isolationId,
      breakpoint: state.viewport.breakpoint,
    })
  }, [])

  const onDrop = useCallback((target: DropTarget, payload: DragPayload) => {
    const command = commandForDrop(target, payload)

    if (command !== null) {
      useStudioStore.getState().dispatch(command)
    }
  }, [])

  return (
    <DndProvider
      gridSize={gridSize}
      onDrop={onDrop}
      rects={layerRects}
      resolveTarget={resolveTarget}
      zoom={zoom}
    >
      {children}
    </DndProvider>
  )
}
