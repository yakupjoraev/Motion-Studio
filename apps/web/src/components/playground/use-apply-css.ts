'use client'

import { type RefObject, useCallback, useEffect, useRef, useState } from 'react'

import { type ValueError, validateValue } from './validate-value'

/**
 * The apply loop — PLAYGROUND.md § Parsing and validation. Three rules, and each one is a decision the
 * document already made:
 *
 * 1. **The last valid value stays rendered.** Blanking the preview on a typo takes away the thing the
 *    reader was comparing against, which is the whole point of the tool.
 * 2. **The property is set on the element.** Never a stylesheet, never `innerHTML` — the value is
 *    untrusted input and the element's own style is the only surface it can reach.
 * 3. **60 ms debounce**, so a fast typist does not pay for a parse per keystroke. `applyNow` is what
 *    `Cmd+Enter` calls.
 */
export const APPLY_DEBOUNCE_MS = 60

export interface ApplyCss {
  readonly value: string
  setValue: (next: string) => void
  /** `Cmd+Enter`: skip the debounce and answer now. */
  applyNow: () => void
  /** What the element is actually painting, which is the last value that validated. */
  readonly applied: string
  readonly errors: readonly ValueError[]
}

export function useApplyCss(
  property: string,
  target: RefObject<HTMLElement | null>,
  initial: string,
): ApplyCss {
  const [value, setValueState] = useState(initial)
  const [applied, setApplied] = useState('')
  const [errors, setErrors] = useState<readonly ValueError[]>([])
  const pending = useRef<number | undefined>(undefined)

  const apply = useCallback(
    (next: string) => {
      const checked = validateValue(property, next)

      if (!checked.ok) {
        setErrors(checked.errors)

        return
      }

      setErrors([])
      setApplied(checked.value)
      target.current?.style.setProperty(property, checked.value)
    },
    [property, target],
  )

  const schedule = useCallback(
    (next: string) => {
      window.clearTimeout(pending.current)
      pending.current = window.setTimeout(() => {
        apply(next)
      }, APPLY_DEBOUNCE_MS)
    },
    [apply],
  )

  const setValue = useCallback(
    (next: string) => {
      setValueState(next)
      schedule(next)
    },
    [schedule],
  )

  const applyNow = useCallback(() => {
    window.clearTimeout(pending.current)
    apply(value)
  }, [apply, value])

  /**
   * A property switch is a different sandbox with a different target element, so the first value is
   * applied on mount rather than waiting for a keystroke that may never come.
   */
  useEffect(() => {
    setValueState(initial)
    setErrors([])
    apply(initial)

    return () => {
      window.clearTimeout(pending.current)
    }
  }, [initial, apply])

  return { value, setValue, applyNow, applied, errors }
}
