'use client'

import { type KeyboardEvent, type PointerEvent, type ReactElement, useCallback } from 'react'

import type { ShapeUnit, TargetSize, Vertex } from './parse-polygon'
import { formatLength } from './parse-polygon'

/**
 * One vertex, as a button — ACCESSIBILITY.md § Playground. A drag-only editor would put the
 * playground's best feature behind a mouse, so every handle is focusable, arrows move it, `Enter`
 * asks for exact numbers and `Delete` removes it.
 */
export const STEP = 1
export const STEP_LARGE = 5

export interface VertexHandleProps {
  readonly index: number
  readonly total: number
  readonly vertex: Vertex
  readonly unit: ShapeUnit
  readonly size: TargetSize
  readonly selected: boolean
  onGrab: (index: number, event: PointerEvent<HTMLButtonElement>) => void
  onNudge: (index: number, dx: number, dy: number) => void
  onRemove: (index: number) => void
  onEdit: (index: number) => void
}

export const unitWord = (unit: ShapeUnit): string => (unit === '%' ? 'percent' : 'pixels')

export const vertexLabel = (index: number, vertex: Vertex, unit: ShapeUnit): string =>
  `Vertex ${index + 1}, ${formatLength(vertex.x)} ${unitWord(unit)} ${formatLength(vertex.y)} ${unitWord(unit)}`

/** Where the handle sits over the target: percentages, because the frame is resizable. */
export const handlePosition = (
  vertex: Vertex,
  unit: ShapeUnit,
  size: TargetSize,
): { readonly left: string; readonly top: string } =>
  unit === '%'
    ? { left: `${vertex.x}%`, top: `${vertex.y}%` }
    : {
        left: `${size.width === 0 ? 0 : (vertex.x / size.width) * 100}%`,
        top: `${size.height === 0 ? 0 : (vertex.y / size.height) * 100}%`,
      }

export function VertexHandle({
  index,
  total,
  vertex,
  unit,
  size,
  selected,
  onGrab,
  onNudge,
  onRemove,
  onEdit,
}: VertexHandleProps): ReactElement {
  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      const step = event.shiftKey ? STEP_LARGE : STEP
      const moves: Readonly<Record<string, readonly [number, number]>> = {
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
        ArrowUp: [0, -step],
        ArrowDown: [0, step],
      }
      const move = moves[event.key]

      if (move !== undefined) {
        event.preventDefault()
        onNudge(index, move[0], move[1])

        return
      }

      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault()
        onRemove(index)

        return
      }

      if (event.key === 'Enter') {
        event.preventDefault()
        onEdit(index)
      }
    },
    [index, onEdit, onNudge, onRemove],
  )

  const position = handlePosition(vertex, unit, size)

  return (
    <button
      type="button"
      aria-label={vertexLabel(index, vertex, unit)}
      aria-pressed={selected}
      data-testid={`vertex-handle-${index}`}
      data-vertex={index}
      onPointerDown={(event) => onGrab(index, event)}
      onKeyDown={onKeyDown}
      style={position}
      className="-translate-x-1/2 -translate-y-1/2 absolute size-6 touch-none rounded-full border-2 border-white bg-accent shadow-sm transition-transform [transition-duration:var(--ms-duration-fast)] hover:scale-110 focus-visible:outline-2 focus-visible:outline-accent-ring focus-visible:outline-offset-2 aria-pressed:scale-110 aria-pressed:bg-accent-strong"
    >
      <span className="sr-only">
        {index + 1} of {total}
      </span>
    </button>
  )
}
