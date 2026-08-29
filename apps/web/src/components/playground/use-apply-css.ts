'use client'

import {
  type CssError,
  type CssFeature,
  findStructuralErrors,
  validateCssValue,
} from '@motion-studio/schema/css'
import { type RefObject, useCallback, useEffect, useRef, useState } from 'react'

/**
 * The apply loop — PLAYGROUND.md § Parsing and validation. Four rules, and each one is a decision the
 * document already made:
 *
 * 1. **The last valid value stays rendered.** Blanking the preview on a typo takes away the thing the
 *    reader was comparing against, which is the whole point of the tool.
 * 2. **The property is set on the element.** Never a stylesheet, never `innerHTML` — the value is
 *    untrusted input and the element's own style is the only surface it can reach.
 * 3. **60 ms debounce**, so a fast typist does not pay for a parse per keystroke. `applyNow` is what
 *    `Cmd+Enter` calls.
 * 4. **Layer 1 is not debounced.** A missing bracket is answered while the key is still down; the
 *    layers that cost something — the browser's own check — wait for the pause.
 *
 * The check itself is `packages/schema`'s, the one `sanitizeDocument` runs on an imported file. There
 * is no validator in this app: ADR-265, and prompt 47's stub is gone.
 */
export const APPLY_DEBOUNCE_MS = 60

export interface ApplyCss {
  readonly value: string
  setValue: (next: string) => void
  /** `Cmd+Enter`: skip the debounce and answer now. */
  applyNow: () => void
  /** What the element is actually painting, which is the last value that validated. */
  readonly applied: string
  readonly errors: readonly CssError[]
  /** Layer 4's compatibility notes for the applied value — § Parsing and validation. */
  readonly features: readonly CssFeature[]
}

export function useApplyCss(
  property: string,
  target: RefObject<HTMLElement | null>,
  initial: string,
): ApplyCss {
  const [value, setValueState] = useState(initial)
  const [applied, setApplied] = useState('')
  const [errors, setErrors] = useState<readonly CssError[]>([])
  const [features, setFeatures] = useState<readonly CssFeature[]>([])
  const pending = useRef<number | undefined>(undefined)

  const apply = useCallback(
    (next: string) => {
      const checked = validateCssValue(property, next)

      if (!checked.ok) {
        setErrors(checked.errors)

        return
      }

      setErrors([])
      setFeatures(checked.features)
      setApplied(checked.normalized)
      target.current?.style.setProperty(property, checked.normalized)
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

      const structural = findStructuralErrors(next)

      /*
       * A structural error is final — no later layer can rescue it — so it is reported now and the
       * apply is not scheduled. A clean structure says nothing yet about the rest, so the errors on
       * screen stay until the debounced pass answers.
       */
      if (structural.length > 0) {
        window.clearTimeout(pending.current)
        setErrors(structural)

        return
      }

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

  return { value, setValue, applyNow, applied, errors, features }
}
