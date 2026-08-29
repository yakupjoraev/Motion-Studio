'use client'

import { type PointerEvent, type ReactElement, useCallback, useRef, useState } from 'react'

import { nudgeVertex, pointerToVertex } from './drag-maths'

import { EdgeHandle } from './edge-handle'
import {
  MIN_VERTICES,
  type Polygon,
  type TargetSize,
  type Vertex,
  insertVertex,
  removeVertex,
} from './parse-polygon'
import { useOverlaySize } from './use-overlay-size'
import { VertexFields } from './vertex-fields'
import { VertexHandle, vertexLabel } from './vertex-handle'

export interface PolygonOverlayProps {
  readonly polygon: Polygon
  onVertices: (next: readonly Vertex[]) => void
  onAnnounce: (message: string) => void
}

const asPercent = (vertex: Vertex, unit: string, box: TargetSize): string =>
  unit === '%'
    ? `${vertex.x},${vertex.y}`
    : `${box.width === 0 ? 0 : (vertex.x / box.width) * 100},${box.height === 0 ? 0 : (vertex.y / box.height) * 100}`

/**
 * The handles, the outline they describe, and the two ways a vertex is added or removed. The overlay
 * sits over the clipped block, so a coordinate read off the grid is the coordinate in the value.
 */
export function PolygonOverlay({
  polygon,
  onVertices,
  onAnnounce,
}: PolygonOverlayProps): ReactElement {
  const overlay = useRef<HTMLDivElement | null>(null)
  const [selected, setSelected] = useState<number | undefined>(undefined)
  const [editing, setEditing] = useState<number | undefined>(undefined)
  const { vertices, unit } = polygon
  const box = useOverlaySize(overlay)

  const replace = useCallback(
    (index: number, vertex: Vertex) => {
      onVertices(vertices.map((current, at) => (at === index ? vertex : current)))
    },
    [onVertices, vertices],
  )

  const onGrab = useCallback(
    (index: number, event: PointerEvent<HTMLButtonElement>) => {
      const rect = overlay.current?.getBoundingClientRect()

      if (rect === undefined) {
        return
      }

      event.preventDefault()
      setSelected(index)
      event.currentTarget.focus()

      const move = (pointer: globalThis.PointerEvent): void => {
        replace(
          index,
          pointerToVertex(
            { x: pointer.clientX - rect.left, y: pointer.clientY - rect.top },
            { width: rect.width, height: rect.height },
            unit,
          ),
        )
      }

      const up = (): void => {
        window.removeEventListener('pointermove', move)
        window.removeEventListener('pointerup', up)
        onAnnounce(vertexLabel(index, vertices[index] ?? { x: 0, y: 0 }, unit))
      }

      window.addEventListener('pointermove', move)
      window.addEventListener('pointerup', up)
    },
    [onAnnounce, replace, unit, vertices],
  )

  const onNudge = useCallback(
    (index: number, dx: number, dy: number) => {
      const vertex = vertices[index]

      if (vertex === undefined) {
        return
      }

      const next = nudgeVertex(vertex, dx, dy, box, unit)

      replace(index, next)
      onAnnounce(vertexLabel(index, next, unit))
    },
    [box, onAnnounce, replace, unit, vertices],
  )

  const onRemove = useCallback(
    (index: number) => {
      if (vertices.length <= MIN_VERTICES) {
        onAnnounce(`A polygon keeps at least ${MIN_VERTICES} vertices.`)

        return
      }

      const next = removeVertex(vertices, index)

      onVertices(next)
      setSelected(undefined)
      onAnnounce(`Vertex ${index + 1} removed. ${next.length} vertices.`)
    },
    [onAnnounce, onVertices, vertices],
  )

  const onInsert = useCallback(
    (edge: number) => {
      const next = insertVertex(vertices, edge)

      onVertices(next)
      setSelected(edge + 1)
      onAnnounce(`Vertex added after ${edge + 1}. ${next.length} vertices.`)
    },
    [onAnnounce, onVertices, vertices],
  )

  return (
    <div ref={overlay} data-testid="polygon-overlay" className="absolute inset-0">
      <svg
        aria-hidden="true"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 h-full w-full"
      >
        <polygon
          points={vertices.map((vertex) => asPercent(vertex, unit, box)).join(' ')}
          fill="none"
          stroke="white"
          strokeWidth={1}
          strokeDasharray="4 3"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {vertices.map((vertex, index) => (
        <VertexHandle
          // biome-ignore lint/suspicious/noArrayIndexKey: a vertex's identity is its place in the ring, and a key that moved with the coordinates would drop focus on every arrow press
          key={index}
          index={index}
          total={vertices.length}
          vertex={vertex}
          unit={unit}
          size={box}
          selected={selected === index}
          onGrab={onGrab}
          onNudge={onNudge}
          onRemove={onRemove}
          onEdit={setEditing}
        />
      ))}
      {vertices.map((vertex, index) => (
        <EdgeHandle
          // biome-ignore lint/suspicious/noArrayIndexKey: an edge is named by the vertex it starts at
          key={`edge-${index}`}
          index={index}
          from={vertex}
          to={vertices[(index + 1) % vertices.length] ?? vertex}
          unit={unit}
          size={box}
          onInsert={onInsert}
        />
      ))}
      <EditedVertex
        index={editing}
        vertices={vertices}
        unit={unit}
        onCommit={replace}
        onAnnounce={onAnnounce}
        onInsertAfter={onInsert}
        onClose={() => setEditing(undefined)}
      />
    </div>
  )
}

interface EditedVertexProps {
  readonly index: number | undefined
  readonly vertices: readonly Vertex[]
  readonly unit: Polygon['unit']
  onCommit: (index: number, vertex: Vertex) => void
  onAnnounce: (message: string) => void
  onInsertAfter: (index: number) => void
  onClose: () => void
}

/** `Enter` on a handle asks for exact numbers — the case a drag cannot answer. */
function EditedVertex({
  index,
  vertices,
  unit,
  onCommit,
  onAnnounce,
  onInsertAfter,
  onClose,
}: EditedVertexProps): ReactElement | null {
  const vertex = index === undefined ? undefined : vertices[index]

  if (index === undefined || vertex === undefined) {
    return null
  }

  return (
    <VertexFields
      index={index}
      vertex={vertex}
      unit={unit}
      onCommit={(next) => {
        onCommit(index, next)
        onAnnounce(vertexLabel(index, next, unit))
      }}
      onInsertAfter={() => onInsertAfter(index)}
      onClose={onClose}
    />
  )
}
