import { cn } from '@motion-studio/utils'
import { type KeyboardEvent, type PointerEvent, type ReactElement, useRef } from 'react'

export interface AngleDialProps {
  readonly value: number
  readonly onChange: (angle: number) => void
  readonly onCommit: (angle: number) => void
  readonly label: string
  readonly disabled: boolean
}

const STEP: Readonly<Record<string, number>> = {
  ArrowRight: 1,
  ArrowUp: 1,
  ArrowLeft: -1,
  ArrowDown: -1,
}

const wrap = (angle: number): number => ((Math.round(angle) % 360) + 360) % 360

/** CSS measures a gradient angle clockwise from twelve o'clock, which is not what `atan2` returns. */
const angleFromPoint = (rect: DOMRect, x: number, y: number): number =>
  wrap(
    (Math.atan2(x - (rect.left + rect.width / 2), rect.top + rect.height / 2 - y) * 180) / Math.PI,
  )

/**
 * The dial § GradientField asks for. `role="slider"` rather than a bare button: an angle is a value with
 * bounds, and the arrow keys have to say so out loud. `Shift` turns by ten, as everywhere else.
 */
export function AngleDial({
  value,
  onChange,
  onCommit,
  label,
  disabled,
}: AngleDialProps): ReactElement {
  const dialRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef<{ moved: boolean } | null>(null)

  const settle = (angle: number, commit: boolean): void => {
    onChange(angle)

    if (commit) {
      onCommit(angle)
    }
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const step = STEP[event.key]

    if (step === undefined) {
      return
    }

    event.preventDefault()
    settle(wrap(value + step * (event.shiftKey ? 10 : 1)), true)
  }

  const track = (event: PointerEvent<HTMLDivElement>, commit: boolean): void => {
    const rect = dialRef.current?.getBoundingClientRect()

    if (rect === undefined || rect.width === 0) {
      return
    }

    settle(angleFromPoint(rect, event.clientX, event.clientY), commit)
  }

  return (
    <div
      ref={dialRef}
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={360}
      aria-valuetext={`${value} degrees`}
      aria-disabled={disabled || undefined}
      className={cn(
        'relative h-[26px] w-[26px] shrink-0 rounded-full border border-border-strong bg-surface-2',
        'outline-none focus-visible:shadow-focus',
        disabled && 'pointer-events-none opacity-50',
      )}
      onKeyDown={onKeyDown}
      // No `preventDefault`: that would suppress the focus a press is supposed to give the dial, and a
      // dial that cannot be focused by clicking it cannot then be turned with the arrow keys.
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId)
        draggingRef.current = { moved: false }
      }}
      // The angle follows the pointer only once it moves. A press that does not travel is someone
      // focusing the dial, and it must not knock the value to wherever they happened to click.
      onPointerMove={(event) => {
        if (draggingRef.current !== null) {
          draggingRef.current.moved = true
          track(event, false)
        }
      }}
      onPointerUp={(event) => {
        const drag = draggingRef.current

        draggingRef.current = null

        if (drag !== null) {
          event.currentTarget.releasePointerCapture(event.pointerId)

          if (drag.moved) {
            track(event, true)
          }
        }
      }}
    >
      {/* The hand, drawn from the centre outward and rotated to the angle. */}
      <span
        aria-hidden
        className="absolute top-1/2 left-1/2 h-[9px] w-[1.5px] origin-bottom rounded-full bg-foreground"
        style={{
          transform: `translate(-50%, -100%) rotate(${value}deg)`,
          transformOrigin: 'bottom',
        }}
      />
    </div>
  )
}
