'use client'

import { Button, Select } from '@motion-studio/ui'
import { type PointerEvent, type ReactElement, useCallback, useMemo, useRef, useState } from 'react'

import { useAnnouncement } from '../use-announcement'

import {
  type Bezier,
  DEFAULT_BEZIER,
  NAMED_CURVES,
  bezierLabel,
  bezierPath,
  clampBezier,
  curveName,
  parseBezier,
  replaceBezier,
  toCssString,
} from './bezier'
import { BezierPreview } from './bezier-preview'
import { ControlPoint } from './control-point'

/** The unit square, in pixels. Small enough for the sandbox, large enough for a 0.01 step to show. */
export const GRID = 180

const DURATION = /(\d+(?:\.\d+)?)(ms|s)\b/

export const durationOf = (value: string): number => {
  const match = DURATION.exec(value)
  const amount = Number(match?.[1] ?? 600)

  return match?.[2] === 's' ? amount * 1000 : amount
}

const CUSTOM = 'custom'

export interface BezierEditorProps {
  readonly value: string
  onValueChange: (next: string) => void
  readonly reduced: boolean
}

/**
 * The draggable curve — PLAYGROUND.md § Property sandboxes. Two control points over a grid, the curve
 * as an SVG path, the four numbers in the value, and a dot that runs on it so the numbers mean
 * something.
 */
export function BezierEditor({ value, onValueChange, reduced }: BezierEditorProps): ReactElement {
  const grid = useRef<HTMLDivElement | null>(null)
  const { message, announce } = useAnnouncement()
  const [replay, setReplay] = useState(0)
  const curve = useMemo(() => parseBezier(value), [value])
  const duration = durationOf(value)

  const write = useCallback(
    (next: Bezier) => {
      onValueChange(replaceBezier(value, clampBezier(next)))
      setReplay((count) => count + 1)
    },
    [onValueChange, value],
  )

  const onGrab = useCallback(
    (index: 1 | 2, event: PointerEvent<HTMLButtonElement>) => {
      const rect = grid.current?.getBoundingClientRect()

      if (rect === undefined || curve === undefined) {
        return
      }

      event.preventDefault()
      event.currentTarget.focus()

      const move = (pointer: globalThis.PointerEvent): void => {
        const x = (pointer.clientX - rect.left) / rect.width
        const y = 1 - (pointer.clientY - rect.top) / rect.height

        write(index === 1 ? { ...curve, x1: x, y1: y } : { ...curve, x2: x, y2: y })
      }

      const up = (): void => {
        window.removeEventListener('pointermove', move)
        window.removeEventListener('pointerup', up)
      }

      window.addEventListener('pointermove', move)
      window.addEventListener('pointerup', up)
    },
    [curve, write],
  )

  const onNudge = useCallback(
    (index: 1 | 2, dx: number, dy: number) => {
      if (curve === undefined) {
        return
      }

      const next = clampBezier(
        index === 1
          ? { ...curve, x1: curve.x1 + dx, y1: curve.y1 + dy }
          : { ...curve, x2: curve.x2 + dx, y2: curve.y2 + dy },
      )

      write(next)
      announce(bezierLabel(next))
    },
    [announce, curve, write],
  )

  if (curve === undefined) {
    return (
      <div className="flex items-center gap-3 rounded-md border border-border p-3">
        <p className="m-0 text-2xs text-foreground-muted" data-testid="bezier-note">
          This value has no cubic-bezier() to drag.
        </p>
        <Button size="sm" variant="secondary" onClick={() => write(DEFAULT_BEZIER)}>
          Add one
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-start gap-4" data-testid="bezier-editor">
      <div
        ref={grid}
        style={{ width: GRID, height: GRID }}
        className="relative shrink-0 rounded-md border border-border bg-[length:25%_25%] bg-[linear-gradient(to_right,oklch(100%_0_0_/_0.08)_1px,transparent_1px),linear-gradient(to_bottom,oklch(100%_0_0_/_0.08)_1px,transparent_1px)]"
      >
        <svg
          aria-hidden="true"
          viewBox={`0 0 ${GRID} ${GRID}`}
          className="absolute inset-0 h-full w-full overflow-visible"
        >
          <line
            x1={0}
            y1={GRID}
            x2={curve.x1 * GRID}
            y2={(1 - curve.y1) * GRID}
            className="stroke-border"
          />
          <line
            x1={GRID}
            y1={0}
            x2={curve.x2 * GRID}
            y2={(1 - curve.y2) * GRID}
            className="stroke-border"
          />
          <path d={bezierPath(curve, GRID)} fill="none" strokeWidth={2} className="stroke-accent" />
        </svg>
        <ControlPoint
          index={1}
          x={curve.x1}
          y={curve.y1}
          size={GRID}
          curve={curve}
          onGrab={onGrab}
          onNudge={onNudge}
        />
        <ControlPoint
          index={2}
          x={curve.x2}
          y={curve.y2}
          size={GRID}
          curve={curve}
          onGrab={onGrab}
          onNudge={onNudge}
        />
      </div>
      <div className="flex min-w-56 flex-1 flex-col gap-2">
        <Select
          value={curveName(curve)}
          onValueChange={(name) => {
            const found = NAMED_CURVES.find((entry) => entry.name === name)

            if (found !== undefined) {
              write(found.curve)
              announce(`${name}: ${bezierLabel(found.curve)}`)
            }
          }}
          options={[
            { value: CUSTOM, label: 'custom' },
            ...NAMED_CURVES.map((entry) => ({ value: entry.name, label: entry.name })),
          ]}
          aria-label="Named curve"
        />
        <p className="m-0 font-mono text-2xs text-foreground-muted" data-testid="bezier-value">
          {toCssString(curve)}
        </p>
        <BezierPreview key={replay} curve={curve} duration={duration} reduced={reduced} />
        <Button size="sm" variant="secondary" onClick={() => setReplay((count) => count + 1)}>
          Replay
        </Button>
        {reduced && (
          <p className="m-0 text-2xs text-foreground-subtle">
            Reduced motion is on, so the dot holds its end state.
          </p>
        )}
        <output aria-live="polite" className="sr-only" data-testid="bezier-announcement">
          {message}
        </output>
      </div>
    </div>
  )
}
