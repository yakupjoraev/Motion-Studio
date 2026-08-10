'use client'

import {
  type Active,
  type Announcements,
  type CollisionDetection,
  DndContext,
  KeyboardSensor,
  type Over,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { Point } from '@motion-studio/utils'
import { type ReactNode, useCallback, useMemo, useRef, useState } from 'react'

import {
  DRAG_INSTRUCTIONS,
  type DragState,
  announceDragCancel,
  announceDragEnd,
  announceDragOver,
  announceDragStart,
} from './announcements'
import { useAnnouncerContainer } from './announcer-container'
import { rectCacheCollision } from './collision/rect-cache-collision'
import type { DragPayload, DragRectSource, DropTarget, DropTargetResolver } from './dnd.types'
import { dragPoint } from './drag-point'
import { DropIndicatorLayer } from './indicators/drop-indicator-layer'
import { createIndicatorHandle } from './indicators/indicator-handle'
import { useDropResolution } from './indicators/use-drop-resolution'
import { DndDragOverlay } from './overlay/drag-overlay'
import { dragPayload, draggedNodeIds, dropZone, payloadLabel } from './payload'
import { useCancelDragOnBlur } from './sensors/cancel-on-blur'
import { canvasAwareCoordinateGetter } from './sensors/keyboard-sensor'
import { POINTER_SENSOR_OPTIONS } from './sensors/pointer-sensor'

export interface DndProviderProps {
  /** The canvas rect cache. A prop, because `dnd` must not import `canvas`. */
  readonly rects: DragRectSource
  readonly zoom: () => number
  readonly gridSize: () => number
  /** Prompt 28's `resolveDropTarget`, bound to the document and registry the host owns. */
  readonly resolveTarget: DropTargetResolver
  /** Called once per accepted drop. Dispatching the command is the application's job. */
  readonly onDrop: (target: DropTarget, payload: DragPayload) => void
  readonly children: ReactNode
}

/**
 * DRAG_AND_DROP.md § Public API. The context, the sensors, the overlay and the announcer live here;
 * every decision about *where* a drop may land is the resolver's, and every consequence of one is the
 * application's.
 */
export function DndProvider({
  rects,
  zoom,
  gridSize,
  resolveTarget,
  onDrop,
  children,
}: DndProviderProps) {
  const [payload, setPayload] = useState<DragPayload | null>(null)
  // Held past the end of the drag on purpose: dnd-kit computes the end announcement after this
  // component's own handler has run, and an announcement without a point has no position to read.
  const point = useRef<Point | null>(null)
  const container = useAnnouncerContainer()

  const sensors = useSensors(
    useSensor(PointerSensor, POINTER_SENSOR_OPTIONS),
    useSensor(KeyboardSensor, {
      coordinateGetter: useMemo(
        () => canvasAwareCoordinateGetter({ zoom, gridSize }),
        [zoom, gridSize],
      ),
      scrollBehavior: 'smooth',
    }),
  )

  const detect = useMemo(() => rectCacheCollision(rects), [rects])
  /** The collision runs on every move and is the only place the drag point is known. */
  const collisionDetection = useCallback<CollisionDetection>(
    (args) => {
      point.current = dragPoint(args.pointerCoordinates, args.collisionRect)

      return detect(args)
    },
    [detect],
  )

  const describe = useCallback(
    (active: Active, over: Over | null): DragState => {
      const dragged = dragPayload(active.data.current)
      const zone = over === null ? null : dropZone(over.data.current)
      const label = dragged === null ? 'block' : payloadLabel(dragged)

      if (dragged === null || zone === null || point.current === null) {
        return { label, zone: null, target: null, count: 0 }
      }

      const moved = draggedNodeIds(dragged)
      const leaving = zone.childIds.some((id) => moved.includes(id))

      return {
        label,
        zone,
        target: resolveTarget({ payload: dragged, zone, point: point.current }),
        count: zone.childIds.length + (leaving ? 0 : 1),
      }
    },
    [resolveTarget],
  )

  // The drag as the frame loop sees it: what is moving and what it is over, held in a ref because a
  // render per pointer move is what § Performance exists to prevent.
  const drag = useRef<{ readonly active: Active; readonly over: Over | null } | null>(null)
  const indicator = useMemo(createIndicatorHandle, [])
  const resolution = useDropResolution({
    indicator,
    resolve: () =>
      drag.current === null ? null : describe(drag.current.active, drag.current.over).target,
  })

  const announcements = useMemo<Announcements>(
    () => ({
      onDragStart: ({ active }) => announceDragStart(describe(active, null).label),
      onDragOver: ({ active, over }) => announceDragOver(describe(active, over)),
      onDragEnd: ({ active, over }) => announceDragEnd(describe(active, over)),
      onDragCancel: ({ active }) => announceDragCancel(describe(active, null).label),
    }),
    [describe],
  )

  useCancelDragOnBlur(payload !== null)

  return (
    <DndContext
      accessibility={{
        announcements,
        ...(container === null ? {} : { container }),
        screenReaderInstructions: DRAG_INSTRUCTIONS,
      }}
      collisionDetection={collisionDetection}
      onDragCancel={() => {
        drag.current = null
        resolution.stop()
        setPayload(null)
      }}
      onDragEnd={({ active, over }) => {
        const { target } = describe(active, over)
        const dragged = dragPayload(active.data.current)

        drag.current = null
        resolution.stop()
        setPayload(null)

        if (dragged !== null && target !== null && target.indicator.kind !== 'reject') {
          onDrop(target, dragged)
        }
      }}
      onDragMove={({ active, over }) => {
        drag.current = { active, over }
        resolution.request(point.current)
      }}
      onDragOver={({ active, over }) => {
        drag.current = { active, over }
      }}
      onDragStart={({ active }) => {
        drag.current = { active, over: null }
        setPayload(dragPayload(active.data.current))
      }}
      sensors={sensors}
    >
      {children}
      <DndDragOverlay payload={payload} />
      <DropIndicatorLayer handle={indicator} />
    </DndContext>
  )
}
