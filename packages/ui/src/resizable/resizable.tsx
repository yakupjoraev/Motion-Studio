import { clamp, cn } from '@motion-studio/utils'
import { type CSSProperties, type PointerEvent, forwardRef, useEffect, useRef } from 'react'

import {
  resizableFrameStyles,
  resizableHandleStyles,
  resizableLineStyles,
} from './resizable.styles'

import type { ResizableProps } from './resizable.types'

/** Dragging right widens a panel whose handle is on its right edge, and narrows one whose handle is left. */
const DIRECTION = { left: -1, right: 1 } as const

/**
 * A resizable panel frame with a draggable, keyboard-operable edge.
 *
 * The width during a drag never enters React. Contract § 5 puts drag deltas in "refs + CSS custom properties"
 * with React re-rendering "on commit only", so a pointer move writes `--ms-resizable-width` on the frame and
 * updates the handle's `aria-valuenow` in place. `onWidthChange` fires once, when the pointer is released.
 *
 * The handle is a `role="separator"` with `aria-valuenow`, which is what makes the width announceable at all:
 * a screen reader reads the new number on every arrow press without a live region.
 */
export const Resizable = forwardRef<HTMLDivElement, ResizableProps>(function Resizable(
  {
    children,
    width,
    min,
    max,
    step = 8,
    side = 'right',
    onWidthChange,
    'aria-label': ariaLabel,
    className,
    handleClassName,
  },
  ref,
) {
  const frameRef = useRef<HTMLDivElement | null>(null)
  const handleRef = useRef<HTMLDivElement | null>(null)
  /** The live width during a drag. A ref, not state — writing it must not render. */
  const liveRef = useRef(width)
  const dragRef = useRef<{ pointerX: number; startWidth: number } | null>(null)

  const setFrame = (node: HTMLDivElement | null): void => {
    frameRef.current = node

    if (typeof ref === 'function') {
      ref(node)
    } else if (ref !== null) {
      ref.current = node
    }
  }

  /** Paint a width without rendering: the custom property moves the panel, the ARIA reports it. */
  const paint = (next: number): void => {
    liveRef.current = next
    frameRef.current?.style.setProperty('--ms-resizable-width', `${next}px`)
    handleRef.current?.setAttribute('aria-valuenow', String(next))
    handleRef.current?.setAttribute('aria-valuetext', `${next} pixels`)
  }

  // A committed width from the caller wins over whatever the last drag painted.
  useEffect(() => {
    paint(width)
  })

  const commit = (next: number): void => {
    paint(next)
    onWidthChange(next)
  }

  const onPointerDown = (event: PointerEvent<HTMLDivElement>): void => {
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { pointerX: event.clientX, startWidth: liveRef.current }
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>): void => {
    const drag = dragRef.current

    if (drag === null) {
      return
    }

    const delta = (event.clientX - drag.pointerX) * DIRECTION[side]

    paint(clamp(drag.startWidth + delta, min, max))
  }

  const onPointerUp = (event: PointerEvent<HTMLDivElement>): void => {
    if (dragRef.current === null) {
      return
    }

    event.currentTarget.releasePointerCapture(event.pointerId)
    dragRef.current = null
    onWidthChange(liveRef.current)
  }

  /** Arrows step by 8 px, `Home` and `End` snap to the bounds — the keyboard path prompt 08 requires. */
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    const stepped: Readonly<Record<string, number>> = {
      ArrowLeft: liveRef.current - step * DIRECTION[side],
      ArrowRight: liveRef.current + step * DIRECTION[side],
      Home: min,
      End: max,
    }

    const next = stepped[event.key]

    if (next === undefined) {
      return
    }

    event.preventDefault()
    commit(clamp(next, min, max))
  }

  return (
    <div
      ref={setFrame}
      style={{ '--ms-resizable-width': `${width}px` } as CSSProperties}
      className={cn(resizableFrameStyles(), className)}
    >
      {children}
      <div
        ref={handleRef}
        // biome-ignore lint/a11y/useSemanticElements: the rule suggests `<hr>`, which is void, cannot hold the 4 px line inside the 8 px target, and is not focusable. This is the WAI-ARIA window splitter pattern — a focusable `role="separator"` carrying `aria-valuenow` — and no element expresses it.
        role="separator"
        aria-label={ariaLabel}
        aria-orientation="vertical"
        aria-valuenow={width}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuetext={`${width} pixels`}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onKeyDown={onKeyDown}
        className={cn(resizableHandleStyles({ side }), handleClassName)}
      >
        <span className={resizableLineStyles()} />
      </div>
    </div>
  )
})
