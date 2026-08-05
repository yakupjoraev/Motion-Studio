import { cn } from '@motion-studio/utils'
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

import { textareaStyles } from './textarea.styles'

import type { TextareaProps } from './textarea.types'

/**
 * Auto-growing: the field is measured after every value change and its height set to the content, bounded by
 * `minRows` and `maxRows`.
 *
 * Measuring means reading `scrollHeight` with the height released first — otherwise the previous height is
 * the floor and the field can only ever grow. `useLayoutEffect` rather than `useEffect` so the resize lands
 * in the same frame as the character the user typed; § Feedback rules asks for feedback within one frame.
 *
 * Past `maxRows` it scrolls rather than growing, so a pasted stylesheet cannot push a panel off screen.
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { minRows = 2, maxRows = 12, invalid = false, className, value, onChange, ...rest },
  ref,
) {
  const inner = useRef<HTMLTextAreaElement>(null)
  const [scrolls, setScrolls] = useState(false)

  useImperativeHandle(ref, () => inner.current as HTMLTextAreaElement)

  const resize = useCallback(() => {
    const element = inner.current
    if (element === null) {
      return
    }

    const style = window.getComputedStyle(element)
    const lineHeight = Number.parseFloat(style.lineHeight) || 16
    const vertical =
      Number.parseFloat(style.paddingTop) +
      Number.parseFloat(style.paddingBottom) +
      Number.parseFloat(style.borderTopWidth) +
      Number.parseFloat(style.borderBottomWidth)

    // Released first: with a height still set, `scrollHeight` never reports less than it, so the field
    // would grow and never shrink.
    element.style.height = 'auto'

    const content = element.scrollHeight
    const min = lineHeight * minRows + vertical
    const max = lineHeight * maxRows + vertical

    element.style.height = `${Math.min(Math.max(content, min), max)}px`
    setScrolls(content > max)
  }, [maxRows, minRows])

  // Mount, and whenever the bounds change: an uncontrolled field measures from here and from `onChange`.
  useLayoutEffect(() => {
    resize()
  }, [resize])

  // A controlled field's value can change without an `onChange` of ours, so it re-measures on the value.
  useLayoutEffect(() => {
    if (value !== undefined) {
      resize()
    }
  }, [resize, value])

  return (
    <textarea
      ref={inner}
      rows={minRows}
      value={value}
      aria-invalid={invalid || undefined}
      className={cn(textareaStyles({ invalid, scrolls }), className)}
      onChange={(event) => {
        onChange?.(event)
        resize()
      }}
      {...rest}
    />
  )
})
