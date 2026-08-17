import type { CollisionDescriptor, CollisionDetection } from '@dnd-kit/core'

import type { ZoneRectSource } from '../dnd.types'
import { type EdgeRect, contains, dragPoint, edgeRect } from '../drag-point'
import { dropZone } from '../payload'

/**
 * DRAG_AND_DROP.md § Performance. dnd-kit's `rectIntersection` measures every droppable on every
 * move, which over 200 nodes is a frame killer. The rects are already in the canvas's cache, so the
 * detector reads them from there — the cache arrives as an argument because `dnd` must not import
 * `canvas` (ARCHITECTURE.md § Rules 8).
 *
 * The deepest container under the point wins, and "deepest" is "smallest": a child container is
 * inside its parent, so it is the one with the smaller area.
 */
export function rectCacheCollision(rects: ZoneRectSource): CollisionDetection {
  return ({ collisionRect, droppableContainers, droppableRects, pointerCoordinates }) => {
    const point = dragPoint(pointerCoordinates, collisionRect)
    const hits: CollisionDescriptor[] = []

    for (const container of droppableContainers) {
      const box = zoneBox(rects, container.id, container.data.current, droppableRects)

      if (box === null || !contains(box, point)) {
        continue
      }

      hits.push({
        id: container.id,
        data: { droppableContainer: container, value: box.width * box.height },
      })
    }

    return hits.sort((first, second) => first.data.value - second.data.value)
  }
}

/**
 * The host answers per zone, because a node id alone does not say which surface is being pointed at
 * (ADR-181). A zone the host has no live rect for falls back to dnd-kit's own map, which is measured
 * once at drag start and so costs no layout either.
 */
function zoneBox(
  rects: ZoneRectSource,
  id: string | number,
  data: unknown,
  measured: ReadonlyMap<string | number, EdgeRect>,
): EdgeRect | null {
  const zone = dropZone(data)
  const cached = zone === null ? undefined : rects.get(zone)

  if (cached !== undefined) {
    return edgeRect(cached)
  }

  return measured.get(id) ?? null
}
