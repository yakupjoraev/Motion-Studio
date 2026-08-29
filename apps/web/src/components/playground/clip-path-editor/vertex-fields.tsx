'use client'

import { Button, Input } from '@motion-studio/ui'
import { type ReactElement, useEffect, useId, useRef, useState } from 'react'

import { type ShapeUnit, type Vertex, formatLength } from './parse-polygon'

export interface VertexFieldsProps {
  readonly index: number
  readonly vertex: Vertex
  readonly unit: ShapeUnit
  onCommit: (next: Vertex) => void
  onInsertAfter: () => void
  onClose: () => void
}

/** Exact numbers for a vertex a drag cannot land on, plus the keyboard's way to add one. */
export function VertexFields({
  index,
  vertex,
  unit,
  onCommit,
  onInsertAfter,
  onClose,
}: VertexFieldsProps): ReactElement {
  const fieldId = useId()
  const first = useRef<HTMLInputElement | null>(null)
  const [x, setX] = useState(formatLength(vertex.x))
  const [y, setY] = useState(formatLength(vertex.y))

  useEffect(() => {
    first.current?.focus()
    first.current?.select()
  }, [])

  const commit = (): void => {
    const next = { x: Number(x), y: Number(y) }

    if (Number.isFinite(next.x) && Number.isFinite(next.y)) {
      onCommit(next)
    }
  }

  return (
    <div
      data-testid="vertex-fields"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation()
          onClose()
        }

        if (event.key === 'Enter') {
          commit()
          onClose()
        }
      }}
      className="absolute right-2 bottom-2 z-10 flex items-end gap-2 rounded-md border border-border bg-surface-1 p-2 shadow-md"
    >
      <label
        className="flex flex-col gap-1 text-2xs text-foreground-muted"
        htmlFor={`${fieldId}-x`}
      >
        Vertex {index + 1} x
        <Input
          id={`${fieldId}-x`}
          ref={first}
          value={x}
          inputMode="decimal"
          suffix={unit}
          onChange={(event) => setX(event.target.value)}
          onBlur={commit}
          className="w-24"
        />
      </label>
      <label
        className="flex flex-col gap-1 text-2xs text-foreground-muted"
        htmlFor={`${fieldId}-y`}
      >
        y
        <Input
          id={`${fieldId}-y`}
          value={y}
          inputMode="decimal"
          suffix={unit}
          onChange={(event) => setY(event.target.value)}
          onBlur={commit}
          className="w-24"
        />
      </label>
      <Button size="sm" variant="secondary" onClick={onInsertAfter}>
        Insert after
      </Button>
      <Button size="sm" variant="ghost" onClick={onClose}>
        Done
      </Button>
    </div>
  )
}
