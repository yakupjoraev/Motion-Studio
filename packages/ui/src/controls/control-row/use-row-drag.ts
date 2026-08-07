import { clamp } from '@motion-studio/utils'
import { type PointerEvent, useRef, useState } from 'react'

export interface RowDragProps {
  readonly onPointerDown: (event: PointerEvent<HTMLElement>) => void
  readonly onPointerMove: (event: PointerEvent<HTMLElement>) => void
  readonly onPointerUp: (event: PointerEvent<HTMLElement>) => void
}

export interface RowDragOptions {
  readonly count: number
  /** Fires as the pointer crosses each row boundary. The list is expected to reorder live. */
  readonly onReorder: (from: number, to: number) => void
  /** Fires once, on release, and only if the order actually changed. */
  readonly onDrop: () => void
}

export interface RowDrag {
  readonly gripProps: (index: number) => RowDragProps
  readonly draggingIndex: number | null
}

/**
 * Reordering a vertical list of rows by dragging a grip. The list reorders as the pointer passes each row
 * boundary rather than showing a ghost, so the feedback is the real result and there is no second layout to
 * keep in step — `UI_GUIDELINES.md` § Feedback rules asks for feedback inside one frame, not for a preview.
 *
 * The buttons beside the grip remain the primary path: `ACCESSIBILITY.md` § Inspector states that
 * drag-only reordering is not accessible, so this is the pointer shortcut for it and never the only way.
 *
 * Row height comes from the row the grip sits in, measured at press time, which is why a list of uniform
 * rows is the assumption. `packages/dnd` (prompt 15) is the general answer; a stack editor does not need it.
 */
export function useRowDrag({ count, onReorder, onDrop }: RowDragOptions): RowDrag {
  const drag = useRef<{ from: number; startY: number; height: number; moved: boolean } | null>(null)
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)

  const gripProps = (index: number): RowDragProps => ({
    onPointerDown: (event) => {
      const row = event.currentTarget.closest('li')

      // Suppresses the text selection a press would otherwise start.
      event.preventDefault()
      event.currentTarget.setPointerCapture(event.pointerId)
      drag.current = {
        from: index,
        startY: event.clientY,
        height: row?.getBoundingClientRect().height ?? 0,
        moved: false,
      }
      setDraggingIndex(index)
    },

    onPointerMove: (event) => {
      const current = drag.current

      if (current === null || current.height === 0) {
        return
      }

      const to = clamp(
        current.from + Math.round((event.clientY - current.startY) / current.height),
        0,
        count - 1,
      )

      if (to !== current.from) {
        onReorder(current.from, to)
        drag.current = { from: to, startY: event.clientY, height: current.height, moved: true }
        setDraggingIndex(to)
      }
    },

    onPointerUp: (event) => {
      const current = drag.current

      drag.current = null
      setDraggingIndex(null)

      if (current === null) {
        return
      }

      event.currentTarget.releasePointerCapture(event.pointerId)

      if (current.moved) {
        onDrop()
      }
    },
  })

  return { gripProps, draggingIndex }
}
