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
 * The width during a drag never enters React — contract § 5. A pointer move writes the custom property and
 * the handle's `aria-valuenow`; `onWidthChange` fires once, on release.
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
  /** A ref, not state: writing it must not render. */
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

  /** Paint without rendering: the property moves the panel, the ARIA reports it. */
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

  /** Arrows step, `Home` and `End` snap to the bounds. */
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
        // biome-ignore lint/a11y/useSemanticElements: `<hr>` is void and not focusable. This is the WAI-ARIA window splitter pattern, and no element expresses it.
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
