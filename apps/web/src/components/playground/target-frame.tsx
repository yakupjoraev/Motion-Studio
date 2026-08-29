'use client'

import {
  type KeyboardEvent,
  type PointerEvent,
  type ReactElement,
  type ReactNode,
  useCallback,
  useRef,
  useState,
} from 'react'

/**
 * The frame the sandbox renders inside, resizable by dragging its right and bottom edges —
 * PLAYGROUND.md § Layout. The reason is in the document: a `clip-path` polygon that looks right at
 * 400 × 300 and wrong at 800 × 200 is exactly the bug this tool should surface, and a fixed preview
 * would hide it.
 *
 * Keyboard too, per ACCESSIBILITY.md: each handle is focusable, arrows resize, and the size is
 * announced — a pointer-only resize would put the whole feature behind a mouse.
 */
export const MIN_SIZE = 160
export const MAX_SIZE = 1400
export const KEYBOARD_STEP = 16
export const KEYBOARD_STEP_LARGE = 64

export interface TargetFrameProps {
  readonly children: ReactNode
  readonly initialWidth?: number
  readonly initialHeight?: number
}

interface Size {
  readonly width: number
  readonly height: number
}

const clamp = (value: number): number => Math.min(MAX_SIZE, Math.max(MIN_SIZE, Math.round(value)))

export function TargetFrame({
  children,
  initialWidth = 640,
  initialHeight = 400,
}: TargetFrameProps): ReactElement {
  const [size, setSize] = useState<Size>({ width: initialWidth, height: initialHeight })
  const frame = useRef<HTMLDivElement | null>(null)

  const resizeBy = useCallback((dx: number, dy: number) => {
    setSize((current) => ({
      width: clamp(current.width + dx),
      height: clamp(current.height + dy),
    }))
  }, [])

  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLButtonElement>, axis: 'x' | 'y' | 'both') => {
      event.preventDefault()
      event.currentTarget.setPointerCapture(event.pointerId)

      const origin = { x: event.clientX, y: event.clientY }
      const start = frame.current?.getBoundingClientRect()

      if (start === undefined) {
        return
      }

      const onMove = (move: globalThis.PointerEvent): void => {
        setSize({
          width: axis === 'y' ? start.width : clamp(start.width + (move.clientX - origin.x)),
          height: axis === 'x' ? start.height : clamp(start.height + (move.clientY - origin.y)),
        })
      }

      const onUp = (): void => {
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
      }

      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
    },
    [],
  )

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, axis: 'x' | 'y' | 'both') => {
      const step = event.shiftKey ? KEYBOARD_STEP_LARGE : KEYBOARD_STEP
      const horizontal = axis !== 'y'
      const vertical = axis !== 'x'

      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        if (!horizontal) {
          return
        }

        event.preventDefault()
        resizeBy(event.key === 'ArrowRight' ? step : -step, 0)

        return
      }

      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        if (!vertical) {
          return
        }

        event.preventDefault()
        resizeBy(0, event.key === 'ArrowDown' ? step : -step)
      }
    },
    [resizeBy],
  )

  const label = `${size.width} by ${size.height} pixels`

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        ref={frame}
        data-testid="target-frame"
        style={{ width: size.width, height: size.height }}
        className="relative max-w-full rounded-lg border border-border bg-surface-1"
      >
        {children}
        <Handle
          axis="x"
          label={`Resize width. ${label}`}
          onPointerDown={onPointerDown}
          onKeyDown={onKeyDown}
          className="-right-1 top-0 h-full w-2 cursor-ew-resize"
        />
        <Handle
          axis="y"
          label={`Resize height. ${label}`}
          onPointerDown={onPointerDown}
          onKeyDown={onKeyDown}
          className="-bottom-1 left-0 h-2 w-full cursor-ns-resize"
        />
        {/*
          A 24 px target with a 12 px mark drawn inside it — WCAG 2.5.8 asks for the target, and the
          corner of a frame is not a place for a 24 px block of colour.
        */}
        <Handle
          axis="both"
          label={`Resize. ${label}`}
          onPointerDown={onPointerDown}
          onKeyDown={onKeyDown}
          className="-right-3 -bottom-3 size-6 cursor-nwse-resize bg-clip-content p-1.5 [background:var(--ms-color-border)_content-box]"
        />
      </div>
      {/* The size, visible as well as announced: a number in the corner beats a guess. */}
      <p className="m-0 font-mono text-foreground-muted text-xs" aria-hidden="true">
        {size.width} × {size.height}
      </p>
      <output className="sr-only" aria-live="polite">
        {label}
      </output>
    </div>
  )
}

interface HandleProps {
  readonly axis: 'x' | 'y' | 'both'
  readonly label: string
  readonly className: string
  onPointerDown: (event: PointerEvent<HTMLButtonElement>, axis: 'x' | 'y' | 'both') => void
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>, axis: 'x' | 'y' | 'both') => void
}

function Handle({ axis, label, className, onPointerDown, onKeyDown }: HandleProps): ReactElement {
  return (
    <button
      type="button"
      aria-label={label}
      data-testid={`target-frame-handle-${axis}`}
      onPointerDown={(event) => onPointerDown(event, axis)}
      onKeyDown={(event) => onKeyDown(event, axis)}
      className={`absolute touch-none focus-visible:outline-2 focus-visible:outline-accent-ring focus-visible:outline-offset-2 ${className}`}
    />
  )
}
