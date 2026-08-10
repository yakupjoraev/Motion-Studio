import type { CollisionDescriptor, CollisionDetection } from '@dnd-kit/core'

import type { DragRectSource } from '../dnd.types'
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
export function rectCacheCollision(rects: DragRectSource): CollisionDetection {
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
 * A canvas container is in the cache under its node id. A drop zone that is not a canvas node — a
 * layers tree row — is not, and dnd-kit's own map holds it; that map is measured once at drag start,
 * so reading it costs no layout either.
 */
function zoneBox(
  rects: DragRectSource,
  id: string | number,
  data: unknown,
  measured: ReadonlyMap<string | number, EdgeRect>,
): EdgeRect | null {
  const zone = dropZone(data)
  const cached = zone === null ? undefined : rects.get(zone.parentId)

  if (cached !== undefined) {
    return edgeRect(cached)
  }

  return measured.get(id) ?? null
}
