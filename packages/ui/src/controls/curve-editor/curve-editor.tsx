import { clamp, cn, round } from '@motion-studio/utils'
import { type PointerEvent, type ReactElement, memo, useRef } from 'react'

import { controlLabelProps } from '../control-row/index'
import { CurveHandle } from './curve-handle'

import type { CubicBezier, CurveEditorProps } from './curve-editor.types'

/** The drawing box, in SVG user units. Y runs 2 → −1 so a curve that overshoots stays visible. */
const BOX = { width: 100, height: 100 } as const
const Y_TOP = 2
const Y_BOTTOM = -1

const toSvgX = (x: number): number => x * BOX.width
const toSvgY = (y: number): number => ((Y_TOP - y) / (Y_TOP - Y_BOTTOM)) * BOX.height

const fromSvgX = (x: number): number => clamp(round(x / BOX.width, 2), 0, 1)
const fromSvgY = (y: number): number =>
  clamp(round(Y_TOP - (y / BOX.height) * (Y_TOP - Y_BOTTOM), 2), Y_BOTTOM, Y_TOP)

/**
 * A draggable cubic-bézier with a live preview dot — prompt 09. Drawn as SVG rather than to a canvas: it
 * has to stay crisp at the 200 % zoom `ACCESSIBILITY.md` requires, and a canvas in jsdom needs a native
 * dependency that § 1 would make us justify — ADR-046.
 *
 * The preview dot runs on a CSS animation whose timing function is the curve itself, so what moves is the
 * curve rather than a re-implementation of it. Reduced motion parks it at the start — `ANIMATION_SYSTEM.md`.
 */
function CurveEditorImpl({
  value,
  onChange,
  onCommit,
  label,
  labelledBy,
  describedBy,
  id,
  disabled = false,
  className,
}: CurveEditorProps): ReactElement {
  const surfaceRef = useRef<SVGSVGElement>(null)
  const draggingRef = useRef<number | null>(null)
  const [x1, y1, x2, y2] = value

  const settle = (next: CubicBezier, commit: boolean): void => {
    onChange(next)

    if (commit) {
      onCommit(next)
    }
  }

  const setPoint = (index: number, x: number, y: number, commit: boolean): void => {
    settle(index === 0 ? [x, y, x2, y2] : [x1, y1, x, y], commit)
  }

  const pointFrom = (event: PointerEvent<SVGSVGElement>): readonly [number, number] | null => {
    const rect = surfaceRef.current?.getBoundingClientRect()

    if (rect === undefined || rect.width === 0) {
      return null
    }

    return [
      fromSvgX(((event.clientX - rect.left) / rect.width) * BOX.width),
      fromSvgY(((event.clientY - rect.top) / rect.height) * BOX.height),
    ]
  }

  const track = (event: PointerEvent<SVGSVGElement>, commit: boolean): void => {
    const index = draggingRef.current
    const point = index === null ? null : pointFrom(event)

    if (index !== null && point !== null) {
      setPoint(index, point[0], point[1], commit)
    }
  }

  const css = `cubic-bezier(${x1}, ${y1}, ${x2}, ${y2})`

  return (
    <div
      id={id}
      // biome-ignore lint/a11y/useSemanticElements: a `fieldset` is named by a `legend`, and this group is named by the row's label; its `min-width: min-content` also breaks the panel's flex layout.
      role="group"
      aria-describedby={describedBy}
      className={cn('flex min-w-0 flex-1 flex-col gap-1', className)}
      {...controlLabelProps(label, labelledBy)}
    >
      <svg
        ref={surfaceRef}
        viewBox={`0 ${toSvgY(Y_TOP)} ${BOX.width} ${BOX.height}`}
        aria-hidden
        className={cn(
          'h-[120px] w-full touch-none rounded-sm border border-border bg-surface-2',
          disabled && 'pointer-events-none opacity-50',
        )}
        onPointerMove={(event) => track(event, false)}
        onPointerUp={(event) => {
          if (draggingRef.current !== null) {
            track(event, true)
            draggingRef.current = null
          }
        }}
      >
        <title>{css}</title>
        <line
          x1={toSvgX(0)}
          y1={toSvgY(0)}
          x2={toSvgX(1)}
          y2={toSvgY(1)}
          className="stroke-border"
          strokeDasharray="2 3"
          strokeWidth={1}
        />
        <path
          d={`M ${toSvgX(0)} ${toSvgY(0)} C ${toSvgX(x1)} ${toSvgY(y1)}, ${toSvgX(x2)} ${toSvgY(y2)}, ${toSvgX(1)} ${toSvgY(1)}`}
          fill="none"
          className="stroke-foreground"
          strokeWidth={2}
        />

        {(
          [
            [x1, y1],
            [x2, y2],
          ] as const
        ).map(([x, y], index) => (
          <g key={index === 0 ? 'p1' : 'p2'}>
            <line
              x1={toSvgX(index === 0 ? 0 : 1)}
              y1={toSvgY(index === 0 ? 0 : 1)}
              x2={toSvgX(x)}
              y2={toSvgY(y)}
              className="stroke-accent"
              strokeWidth={1}
            />
            <circle
              cx={toSvgX(x)}
              cy={toSvgY(y)}
              r={5}
              className="cursor-grab fill-accent"
              onPointerDown={(event) => {
                event.currentTarget.ownerSVGElement?.setPointerCapture(event.pointerId)
                draggingRef.current = index
              }}
            />
          </g>
        ))}
      </svg>

      <span className="flex items-center gap-2">
        <span
          aria-hidden
          data-testid="curve-preview"
          className="ms-curve-preview h-[8px] w-[8px] rounded-full bg-accent"
          style={{ animationTimingFunction: css }}
        />
        <span data-testid="curve-css" className="truncate text-2xs text-foreground-muted">
          {css}
        </span>
      </span>

      <CurveHandle
        name={`${label} point 1`}
        x={x1}
        y={y1}
        disabled={disabled}
        onChange={(x, y, commit) => setPoint(0, x, y, commit)}
      />
      <CurveHandle
        name={`${label} point 2`}
        x={x2}
        y={y2}
        disabled={disabled}
        onChange={(x, y, commit) => setPoint(1, x, y, commit)}
      />
    </div>
  )
}

export const CurveEditor = memo(CurveEditorImpl)
