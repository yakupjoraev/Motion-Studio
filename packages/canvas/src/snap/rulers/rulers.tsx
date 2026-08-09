'use client'

import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react'

import { VIEWPORT_VARS, type ViewportHandle } from '../../viewport/use-viewport'
import {
  RULER_CORNER_CLASS,
  RULER_CURSOR_CLASS,
  RULER_LABEL_CLASS,
  RULER_STRIP_CLASS,
  USER_GUIDE_CLASS,
  placeOnAxis,
} from '../snap.styles'
import type { CanvasGuidePort, SnapAxis } from '../snap.types'

import { majorTickStep, minorTickStep, rulerTicks } from './ruler-ticks'
import { CURSOR_VAR, useRulerDrag } from './use-ruler-drag'

/** Both strips, and the corner that covers where they cross. */
export const RULER_SIZE_PX = 24

/** Canvas units the labels cover: the visible range, plus one screen either side. */
interface TickWindow {
  readonly major: number
  readonly x: readonly [number, number]
  readonly y: readonly [number, number]
}

export interface RulersProps {
  readonly viewport: ViewportHandle
  readonly guides?: CanvasGuidePort | undefined
}

/**
 * CANVAS.md § Rulers. Ticks are a repeating gradient and labels are placed with `calc()` over the
 * viewport variables, so panning and zooming move all of it without a render. React runs only when
 * the tick step changes or the pan leaves the range already labelled — a few times a session.
 */
export function Rulers({ viewport, guides }: RulersProps) {
  const cursorX = useRef<HTMLDivElement | null>(null)
  const cursorY = useRef<HTMLDivElement | null>(null)
  const previewX = useRef<HTMLDivElement | null>(null)
  const previewY = useRef<HTMLDivElement | null>(null)
  const cursors = useMemo(() => ({ x: cursorX, y: cursorY }), [])
  const previews = useMemo(() => ({ x: previewX, y: previewY }), [])
  const [window_, setWindow] = useState<TickWindow>(() => nextWindow(null, viewport))

  const drag = useRulerDrag({ viewport, guides, previews, cursors })

  useEffect(
    () => viewport.subscribe(() => setWindow((current) => nextWindow(current, viewport))),
    [viewport],
  )

  const minor = minorTickStep(window_.major)

  return (
    <>
      <Strip
        axis="x"
        cursorRef={cursorX}
        drag={drag}
        major={window_.major}
        minor={minor}
        range={window_.x}
      />
      <Strip
        axis="y"
        cursorRef={cursorY}
        drag={drag}
        major={window_.major}
        minor={minor}
        range={window_.y}
      />
      <div className={RULER_CORNER_CLASS} data-testid="ruler-corner" />
      <div
        className={`${USER_GUIDE_CLASS} hidden data-[active]:block`}
        data-axis="x"
        data-testid="guide-preview-x"
        ref={previewX}
      />
      <div
        className={`${USER_GUIDE_CLASS} hidden data-[active]:block`}
        data-axis="y"
        data-testid="guide-preview-y"
        ref={previewY}
      />
    </>
  )
}

interface StripProps {
  readonly axis: SnapAxis
  readonly major: number
  readonly minor: number
  readonly range: readonly [number, number]
  readonly drag: ReturnType<typeof useRulerDrag>
  readonly cursorRef: React.RefObject<HTMLDivElement | null>
}

function Strip({ axis, major, minor, range, drag, cursorRef }: StripProps) {
  // The top ruler measures x and drags out a horizontal guide, which is one at a constant y.
  const creates: SnapAxis = axis === 'x' ? 'y' : 'x'
  const along = (offset: string): CSSProperties =>
    axis === 'x' ? { left: offset } : { top: offset }

  return (
    <div
      className={RULER_STRIP_CLASS}
      data-axis={axis}
      data-testid={`ruler-${axis}`}
      data-ruler=""
      onPointerDown={(event) => drag.start(event, creates)}
      style={stripStyle(axis, major, minor)}
    >
      {rulerTicks(range[0], range[1], major).map((value) => (
        <span
          className={RULER_LABEL_CLASS}
          data-axis={axis}
          key={value}
          style={along(placeOnAxis(axis, value))}
        >
          {value}
        </span>
      ))}
      <div
        className={RULER_CURSOR_CLASS}
        data-axis={axis}
        data-testid={`ruler-cursor-${axis}`}
        ref={cursorRef}
        style={along(`var(${CURSOR_VAR}, -10px)`)}
      />
    </div>
  )
}

/** Two gradient layers — minor ticks 6 px deep, major 12 px — offset and scaled by the transform. */
function stripStyle(axis: SnapAxis, major: number, minor: number): CSSProperties {
  const zoom = `var(${VIEWPORT_VARS.zoom}, 1)`
  const offset = `calc(var(${axis === 'x' ? VIEWPORT_VARS.x : VIEWPORT_VARS.y}, 0px) * ${zoom})`
  const line = `repeating-linear-gradient(${axis === 'x' ? 'to right' : 'to bottom'}, var(--ms-color-border-strong, currentColor) 0 1px, transparent 1px 100%)`
  const size = (step: number, depth: number): string =>
    axis === 'x' ? `calc(${step}px * ${zoom}) ${depth}px` : `${depth}px calc(${step}px * ${zoom})`

  return {
    backgroundImage: `${line}, ${line}`,
    backgroundSize: `${size(minor, 6)}, ${size(major, 12)}`,
    backgroundPosition:
      axis === 'x' ? `${offset} 100%, ${offset} 100%` : `100% ${offset}, 100% ${offset}`,
    backgroundRepeat: axis === 'x' ? 'repeat-x, repeat-x' : 'repeat-y, repeat-y',
  }
}

/**
 * Returns the same object when nothing has to change, so this can be called on every frame: React
 * bails out of a `setState` that produces the identical value, and the common case — a pan of a few
 * pixels — produces one.
 */
function nextWindow(current: TickWindow | null, viewport: ViewportHandle): TickWindow {
  const { zoom, pan } = viewport.current()
  const rect = viewport.viewportRect()
  const major = majorTickStep(zoom)
  const visible = {
    x: [-pan.x, rect.width / zoom - pan.x] as const,
    y: [-pan.y, rect.height / zoom - pan.y] as const,
  }

  if (current !== null && current.major === major && inside(current, visible)) {
    return current
  }

  return {
    major,
    x: widen(visible.x),
    y: widen(visible.y),
  }
}

const widen = ([from, to]: readonly [number, number]): readonly [number, number] => {
  const margin = to - from

  return [from - margin, to + margin]
}

const inside = (
  window_: TickWindow,
  visible: { readonly x: readonly [number, number]; readonly y: readonly [number, number] },
): boolean =>
  window_.x[0] <= visible.x[0] &&
  window_.x[1] >= visible.x[1] &&
  window_.y[0] <= visible.y[0] &&
  window_.y[1] >= visible.y[1]
