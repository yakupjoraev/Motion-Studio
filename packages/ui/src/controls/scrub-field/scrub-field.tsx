import { cn } from '@motion-studio/utils'
import {
  type ChangeEvent,
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent,
  type ReactElement,
  memo,
  useEffect,
  useRef,
  useState,
} from 'react'

import { controlLabelProps } from '../control-row/index'
import { evaluateExpression } from './expression'
import { scrubFieldStyles } from './scrub-field.styles'
import {
  type ScrubBounds,
  formatDisplay,
  formatValue,
  modifierScale,
  precisionOfStep,
  quantize,
  speakValue,
  stripUnit,
} from './scrub-value'

import type { ScrubFieldProps } from './scrub-field.types'

/** `DRAG_AND_DROP.md` § Activation: 4 px, so a click is never a drag. Same reasoning, same number. */
const DRAG_ACTIVATION = 4

/**
 * `movementX` where the platform reports it, which is every browser. React's synthetic event
 * substitutes 0 when the native event has none, so the presence check is on the native event — and the
 * pointer's own displacement stands in, which is the same quantity outside pointer lock.
 */
const displacement = (event: PointerEvent<HTMLInputElement>, lastX: number): number =>
  'movementX' in event.nativeEvent ? event.movementX : event.clientX - lastX

function ScrubFieldImpl({
  value,
  onChange,
  onCommit,
  label,
  labelledBy,
  describedBy,
  id,
  disabled = false,
  mixed = false,
  min,
  max,
  step = 1,
  unit,
  precision,
  className,
}: ScrubFieldProps): ReactElement {
  const bounds: ScrubBounds = {
    ...(min === undefined ? {} : { min }),
    ...(max === undefined ? {} : { max }),
    step,
    precision: precision ?? precisionOfStep(step),
  }

  const [live, setLive] = useState(value)
  const [draft, setDraft] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  const dragRef = useRef<{ value: number; travelled: number } | null>(null)
  const lastXRef = useRef(0)
  const frameRef = useRef<number | null>(null)
  const focusValueRef = useRef(value)

  const steppedBy = (event: { readonly shiftKey: boolean; readonly altKey: boolean }): number =>
    step * modifierScale(event)

  /** `Alt` refines the grid the result snaps to; `Shift` must not coarsen it — ADR-041. */
  const stepped = (event: {
    readonly shiftKey: boolean
    readonly altKey: boolean
  }): ScrubBounds => ({
    ...bounds,
    step: Math.min(step, steppedBy(event)),
  })

  // A committed value from the caller wins over whatever the last gesture left behind.
  useEffect(() => {
    if (dragRef.current === null) {
      setLive(value)
    }
  }, [value])

  const flush = (): void => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }
  }

  /** One `onChange` per frame however many moves arrived — `PERFORMANCE.md` § The core rule. */
  const scheduleFrame = (): void => {
    if (frameRef.current !== null) {
      return
    }

    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null
      const drag = dragRef.current

      if (drag !== null) {
        setLive(drag.value)
        onChange(drag.value)
      }
    })
  }

  const settle = (next: number): void => {
    setLive(next)
    onChange(next)
    onCommit(next)
  }

  const onPointerDown = (event: PointerEvent<HTMLInputElement>): void => {
    if (disabled || document.activeElement === event.currentTarget) {
      return
    }

    // Suppresses the text selection a press on an input would otherwise start; focus is restored on
    // release when the pointer never travelled far enough to be a drag.
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { value: live, travelled: 0 }
    lastXRef.current = event.clientX
  }

  const onPointerMove = (event: PointerEvent<HTMLInputElement>): void => {
    const drag = dragRef.current

    if (drag === null) {
      return
    }

    const movement = displacement(event, lastXRef.current)

    lastXRef.current = event.clientX
    drag.travelled += Math.abs(movement)

    if (drag.travelled < DRAG_ACTIVATION) {
      return
    }

    setDragging(true)
    drag.value = quantize(drag.value + movement * steppedBy(event), stepped(event))
    scheduleFrame()
  }

  const onPointerUp = (event: PointerEvent<HTMLInputElement>): void => {
    const drag = dragRef.current

    if (drag === null) {
      return
    }

    event.currentTarget.releasePointerCapture(event.pointerId)
    flush()
    dragRef.current = null
    setDragging(false)

    if (drag.travelled < DRAG_ACTIVATION) {
      event.currentTarget.focus()
      event.currentTarget.select()

      return
    }

    settle(drag.value)
  }

  const onFocus = (event: FocusEvent<HTMLInputElement>): void => {
    focusValueRef.current = live
    // Empty across a disagreeing selection: § Multi-selection says editing applies to all, and a
    // pre-filled number would be one node's value standing in for the rest.
    setDraft(mixed ? '' : formatValue(live, bounds.precision))
    event.currentTarget.select()
  }

  /** An unparseable draft reverts rather than clearing: a typo must not destroy the value. */
  const commitDraft = (): void => {
    const parsed = draft === null ? null : evaluateExpression(stripUnit(draft, unit))

    setDraft(null)

    if (parsed === null) {
      return
    }

    const next = quantize(parsed, bounds)

    if (next !== live) {
      settle(next)
    }
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    const direction = event.key === 'ArrowUp' ? 1 : event.key === 'ArrowDown' ? -1 : 0

    if (direction !== 0) {
      event.preventDefault()
      const next = quantize(live + direction * steppedBy(event), stepped(event))

      setDraft(formatValue(next, bounds.precision))

      // A step that lands on the value it started from is not an edit — ADR-043.
      if (next !== live) {
        settle(next)
      }
    } else if (event.key === 'Enter') {
      event.preventDefault()
      commitDraft()
    } else if (event.key === 'Escape') {
      event.preventDefault()
      setDraft(null)

      if (focusValueRef.current !== live) {
        settle(focusValueRef.current)
      }
    }
  }

  const displayed = draft ?? (mixed ? '' : formatDisplay(live, bounds.precision, unit))

  return (
    <input
      id={id}
      type="text"
      role="spinbutton"
      inputMode="decimal"
      autoComplete="off"
      disabled={disabled}
      value={displayed}
      placeholder={mixed ? 'Mixed' : undefined}
      aria-valuenow={mixed ? undefined : live}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuetext={mixed ? 'Mixed' : speakValue(live, bounds.precision, unit)}
      aria-describedby={describedBy}
      data-dragging={dragging ? '' : undefined}
      className={cn(scrubFieldStyles({ dragging }), className)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onFocus={onFocus}
      onBlur={commitDraft}
      onKeyDown={onKeyDown}
      onChange={(event: ChangeEvent<HTMLInputElement>) => setDraft(event.target.value)}
      {...controlLabelProps(label, labelledBy)}
    />
  )
}

/** `PERFORMANCE.md` § Memoisation map: an inspector control memoises on its value and its path. */
export const ScrubField = memo(ScrubFieldImpl)
