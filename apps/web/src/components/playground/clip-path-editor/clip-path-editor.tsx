'use client'

import { Segmented } from '@motion-studio/ui'
import { type ReactElement, type RefObject, useCallback, useMemo, useRef } from 'react'

import { useAnnouncement } from '../use-announcement'
import { parseParametricShape, serializeParametricShape, shapeKindOf } from './basic-shape'
import {
  type ShapeUnit,
  type Vertex,
  convertUnit,
  parsePolygon,
  serializePolygon,
} from './parse-polygon'
import { PolygonOverlay } from './polygon-overlay'
import { ShapeParams } from './shape-params'
import { useOverlaySize } from './use-overlay-size'

export interface ClipPathEditorProps {
  readonly value: string
  onValueChange: (next: string) => void
  /** The clipped block. A drag writes it here directly so the shape is not four frames behind. */
  readonly target: RefObject<HTMLElement | null>
}

const UNITS = [
  { value: '%', content: '%', label: 'Percent' },
  { value: 'px', content: 'px', label: 'Pixels' },
]

/**
 * The `clip-path` sandbox's tools — PLAYGROUND.md § Property sandboxes. Which one a value gets is the
 * value's own answer: `polygon()` has handles, `circle()` / `ellipse()` / `inset()` have parameters,
 * and `path()` has neither and says so rather than pretending.
 */
export function ClipPathEditor({
  value,
  onValueChange,
  target,
}: ClipPathEditorProps): ReactElement {
  const root = useRef<HTMLDivElement | null>(null)
  const size = useOverlaySize(root)
  const { message, announce } = useAnnouncement()
  const kind = shapeKindOf(value)
  const polygon = useMemo(() => parsePolygon(value), [value])
  const shape = useMemo(() => parseParametricShape(value), [value])

  /*
   * The value goes to the editor and to the element in the same breath: `useApplyCss` debounces 60 ms
   * before it paints, which is right for typing and wrong for a pointer that is still moving.
   */
  const write = useCallback(
    (next: string) => {
      target.current?.style.setProperty('clip-path', next)
      onValueChange(next)
    },
    [onValueChange, target],
  )

  const onVertices = useCallback(
    (vertices: readonly Vertex[]) => {
      if (!polygon.ok) {
        return
      }

      write(serializePolygon(vertices, polygon.value.unit, polygon.value.fillRule))
    },
    [polygon, write],
  )

  const onUnit = useCallback(
    (next: string) => {
      if (!polygon.ok || next === polygon.value.unit) {
        return
      }

      const unit: ShapeUnit = next === 'px' ? 'px' : '%'

      write(
        serializePolygon(
          convertUnit(polygon.value.vertices, polygon.value.unit, unit, size),
          unit,
          polygon.value.fillRule,
        ),
      )
      announce(`Vertices in ${unit === '%' ? 'percent' : 'pixels'}.`)
    },
    [announce, polygon, size, write],
  )

  return (
    <div ref={root} className="absolute inset-0" data-testid="clip-path-editor">
      {polygon.ok && (
        <PolygonOverlay polygon={polygon.value} onVertices={onVertices} onAnnounce={announce} />
      )}
      {/* Below the block, not over it: a control on the shape covers the vertex it is there to move. */}
      <div className="absolute inset-x-0 top-full flex flex-col items-center gap-2 pt-2">
        {shape !== undefined && (
          <ShapeParams shape={shape} onChange={(next) => write(serializeParametricShape(next))} />
        )}
        {kind === 'path' && (
          <p
            className="m-0 rounded-md bg-surface-1/90 px-3 py-2 text-2xs text-foreground-muted"
            data-testid="clip-path-note"
          >
            A path() is edited as text: its commands are not a list of vertices.
          </p>
        )}
        {!polygon.ok && kind === 'polygon' && (
          <p
            className="m-0 rounded-md bg-surface-1/90 px-3 py-2 text-2xs text-foreground-muted"
            data-testid="clip-path-note"
          >
            {polygon.error.message}
          </p>
        )}
        {polygon.ok && (
          <div className="flex items-center gap-2 rounded-md bg-surface-1/90 px-2 py-1">
            <span className="text-2xs text-foreground-muted">Units</span>
            <Segmented
              options={UNITS}
              value={polygon.value.unit}
              onValueChange={onUnit}
              aria-label="Vertex units"
            />
          </div>
        )}
      </div>
      <output aria-live="polite" className="sr-only" data-testid="vertex-announcement">
        {message}
      </output>
    </div>
  )
}
