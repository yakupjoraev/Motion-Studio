'use client'

import {
  DndProvider,
  type DragPayload,
  type DragRectSource,
  type DropSurface,
  type DropTarget,
  type DropTargetResolver,
  type DropZone,
  type PlacementChild,
  type ZoneRectSource,
  commandForDrop,
  draggedNodeIds,
  resolveDropTarget,
} from '@motion-studio/dnd'
import { DENSITY } from '@motion-studio/ui'
import { type ReactNode, useCallback, useMemo, useRef } from 'react'

import { useRegistryCopy } from '../../lib/i18n/studio-surface'
import { deferredBlockRegistry } from '../../store/block-registry'
import { useStudioStore } from '../../store/editor-store'

import { canvasRects } from './canvas-area/canvas-handle'
import { layerRects } from './left-panel/layers/layer-rects'

export interface DndHostProps {
  readonly children: ReactNode
}

/** ADR-134 for the tree, ADR-127 for the canvas: one row there, one visual grid cell here. */
const CANVAS_GRID_PX = 8

/**
 * DRAG_AND_DROP.md § Public API: the provider wraps the studio, and the four things it does not own
 * arrive here — the geometry, the resolver bound to this document, and the command a drop becomes.
 * The shell stays a room with no idea what a document is.
 *
 * Two surfaces register zones for the same node ids, so every question about geometry is asked per
 * zone and answered by the surface that drew it — ADR-181.
 */
export function DndHost({ children }: DndHostProps) {
  const copy = useRegistryCopy()

  /** Which surface the drag is currently over, so a keyboard step is that surface's step. */
  const surface = useRef<DropSurface>('canvas')

  const rects = useMemo<ZoneRectSource>(
    () => ({
      get: (zone) => rectsFor(zone.surface).get(zone.parentId),
    }),
    [],
  )

  /**
   * A keyboard step is one position, and only the surface that drew the zone knows where its
   * positions are — ADR-381. Document order, unmeasured children dropped, the same way
   * `resolveDropTarget` reads them.
   */
  const siblings = useCallback((zone: DropZone): readonly PlacementChild[] => {
    const source = rectsFor(zone.surface)

    return zone.childIds.flatMap((id) => {
      const rect = source.get(id)

      return rect === undefined ? [] : [{ id, rect }]
    })
  }, [])

  const resolveTarget = useCallback<DropTargetResolver>(({ payload, zone, point }) => {
    const state = useStudioStore.getState()

    surface.current = zone.surface

    return resolveDropTarget({
      point,
      // The collision already decided which container the pointer is in, by the geometry of ADR-133.
      hitNodeId: zone.parentId,
      draggedBlockId: payload.blockId,
      draggedNodeIds: draggedNodeIds(payload),
      document: state.document,
      registry: deferredBlockRegistry,
      rects: rectsFor(zone.surface),
      isolationId: state.selection.isolationId,
      breakpoint: state.viewport.breakpoint,
    })
  }, [])

  const onDrop = useCallback(
    (target: DropTarget, payload: DragPayload) => {
      const command = commandForDrop(target, payload, copy?.defaults)

      if (command !== null) {
        useStudioStore.getState().dispatch(command)
      }
    },
    [copy],
  )

  const gridSize = useCallback(
    (): number => (surface.current === 'tree' ? DENSITY.layerRow : CANVAS_GRID_PX),
    [],
  )

  /** The tree does not scale; the canvas does, and a step there is `gridSize × zoom` (ADR-127). */
  const zoom = useCallback(
    (): number => (surface.current === 'tree' ? 1 : (canvasRects.transform()?.zoom ?? 1)),
    [],
  )

  return (
    <DndProvider
      gridSize={gridSize}
      onDrop={onDrop}
      rects={rects}
      resolveTarget={resolveTarget}
      siblings={siblings}
      zoom={zoom}
    >
      {children}
    </DndProvider>
  )
}

const rectsFor = (surface: DropSurface): DragRectSource =>
  surface === 'tree' ? layerRects : canvasRects
