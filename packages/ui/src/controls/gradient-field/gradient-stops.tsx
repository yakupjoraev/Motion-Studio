import { cn } from '@motion-studio/utils'
import { type KeyboardEvent, type PointerEvent, type ReactElement, useRef } from 'react'

import { CHECKERBOARD } from '../color-picker/index'

import type { ColorStop } from '@motion-studio/tokens'

export interface GradientStopsProps {
  readonly stops: readonly ColorStop[]
  readonly selected: number
  readonly label: string
  readonly disabled: boolean
  /** The `background-image` the track paints, so the handles sit over the colours they carry. */
  readonly preview: string
  readonly onSelect: (index: number) => void
  readonly onMove: (index: number, position: number, commit: boolean) => void
}

const STEP: Readonly<Record<string, number>> = { ArrowRight: 1, ArrowLeft: -1 }

/**
 * The stop track. Each handle is a `slider`: a stop's position is a bounded value, and the arrow keys have
 * to move it and announce it — dragging alone is not an accessible way to place a stop.
 */
export function GradientStops({
  stops,
  selected,
  label,
  disabled,
  preview,
  onSelect,
  onMove,
}: GradientStopsProps): ReactElement {
  const trackRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef<number | null>(null)

  const positionFrom = (event: PointerEvent<HTMLElement>): number | null => {
    const rect = trackRef.current?.getBoundingClientRect()

    if (rect === undefined || rect.width === 0) {
      return null
    }

    return ((event.clientX - rect.left) / rect.width) * 100
  }

  const onKeyDown = (event: KeyboardEvent<HTMLElement>, index: number): void => {
    const step = STEP[event.key]

    if (step === undefined) {
      return
    }

    event.preventDefault()
    const stop = stops[index]

    if (stop !== undefined) {
      onMove(index, stop.position + step * (event.shiftKey ? 10 : 1), true)
    }
  }

  return (
    <div
      ref={trackRef}
      className={cn('relative h-[20px] w-full rounded-sm border border-border', CHECKERBOARD)}
    >
      <span
        aria-hidden
        className="absolute inset-0 rounded-[1px]"
        style={{ backgroundImage: preview }}
      />

      {stops.map((stop, index) => (
        <button
          // Position is not an identity: two stops may share one while a drag passes through.
          key={`${index}-${stop.color}`}
          type="button"
          role="slider"
          aria-label={`${label} stop ${index + 1}`}
          aria-valuenow={stop.position}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuetext={`${stop.position}%, ${stop.color}`}
          aria-disabled={disabled || undefined}
          tabIndex={disabled ? -1 : 0}
          className={cn(
            '-translate-x-1/2 absolute top-1/2 h-[14px] w-[14px] rounded-full border-2',
            'outline-none focus-visible:shadow-focus',
            index === selected ? 'border-accent' : 'border-white',
          )}
          style={{
            left: `${stop.position}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)',
            background: stop.color,
          }}
          onClick={() => onSelect(index)}
          onKeyDown={(event) => onKeyDown(event, index)}
          onPointerDown={(event) => {
            if (disabled) {
              return
            }

            event.currentTarget.setPointerCapture(event.pointerId)
            draggingRef.current = index
            onSelect(index)
          }}
          onPointerMove={(event) => {
            const position = draggingRef.current === null ? null : positionFrom(event)

            if (position !== null) {
              onMove(index, position, false)
            }
          }}
          onPointerUp={(event) => {
            if (draggingRef.current === null) {
              return
            }

            event.currentTarget.releasePointerCapture(event.pointerId)
            draggingRef.current = null
            const position = positionFrom(event)

            if (position !== null) {
              onMove(index, position, true)
            }
          }}
        />
      ))}
    </div>
  )
}
