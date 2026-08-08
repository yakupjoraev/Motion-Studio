'use client'

import { clamp, cn } from '@motion-studio/utils'
import { type KeyboardEvent, type PointerEvent, useRef } from 'react'

import { PANEL_BOUNDS, type PanelSide, paintPanelWidth } from '../../hooks/panel-layout'

export interface PanelResizerProps {
  readonly side: PanelSide
  /** The committed width. What the drag paints in between never reaches React — ADR-049. */
  readonly width: number
  readonly onWidthChange: (width: number) => void
  readonly 'aria-label': string
}

/** Dragging right widens the left panel and narrows the right one. */
const DIRECTION = { left: 1, right: -1 } as const

/** § Layout gives the handle a 4 px line; one arrow press moves it by the grid step. */
const STEP = 8

/**
 * The window-splitter handle for one panel edge. It sizes a **grid track**, which is why it exists
 * beside `Resizable` in `packages/ui` rather than reusing it — ADR-049 has the measurement.
 */
export function PanelResizer({
  side,
  width,
  onWidthChange,
  'aria-label': ariaLabel,
}: PanelResizerProps) {
  const handleRef = useRef<HTMLDivElement | null>(null)
  /** A ref, not state: a pointer move must not render. */
  const liveRef = useRef(width)
  const dragRef = useRef<{ pointerX: number; startWidth: number } | null>(null)
  const bounds = PANEL_BOUNDS[side]

  const paint = (next: number): void => {
    liveRef.current = next
    paintPanelWidth(side, next)
    handleRef.current?.setAttribute('aria-valuenow', String(next))
    handleRef.current?.setAttribute('aria-valuetext', `${next} pixels`)
  }

  const onPointerDown = (event: PointerEvent<HTMLDivElement>): void => {
    event.currentTarget.setPointerCapture(event.pointerId)
    liveRef.current = width
    dragRef.current = { pointerX: event.clientX, startWidth: width }
    document.documentElement.setAttribute('data-panel-resizing', '')
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>): void => {
    const drag = dragRef.current

    if (drag === null) {
      return
    }

    const delta = (event.clientX - drag.pointerX) * DIRECTION[side]

    paint(clamp(drag.startWidth + delta, bounds.min, bounds.max))
  }

  const endDrag = (event: PointerEvent<HTMLDivElement>): void => {
    if (dragRef.current === null) {
      return
    }

    event.currentTarget.releasePointerCapture(event.pointerId)
    dragRef.current = null
    document.documentElement.removeAttribute('data-panel-resizing')
    onWidthChange(liveRef.current)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const stepped: Readonly<Record<string, number>> = {
      ArrowLeft: width - STEP * DIRECTION[side],
      ArrowRight: width + STEP * DIRECTION[side],
      Home: bounds.min,
      End: bounds.max,
    }

    const next = stepped[event.key]

    if (next === undefined) {
      return
    }

    event.preventDefault()
    onWidthChange(clamp(next, bounds.min, bounds.max))
  }

  return (
    <div
      ref={handleRef}
      // biome-ignore lint/a11y/useSemanticElements: the WAI-ARIA window splitter pattern. `<hr>` is void and cannot take focus.
      role="separator"
      aria-label={ariaLabel}
      aria-orientation="vertical"
      aria-valuenow={width}
      aria-valuemin={bounds.min}
      aria-valuemax={bounds.max}
      aria-valuetext={`${width} pixels`}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={onKeyDown}
      className={cn(
        'group absolute inset-y-0 z-20 ms-panel-resizer ms-transition-control flex w-[8px] cursor-col-resize touch-none items-stretch justify-center outline-none focus-visible:shadow-focus',
        side === 'left' ? '-right-[4px]' : '-left-[4px]',
      )}
    >
      <span className="ms-transition-control w-[4px] bg-transparent group-hover:bg-border-strong group-focus-visible:bg-accent" />
    </div>
  )
}
