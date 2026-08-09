import { textStyles } from './text.styles'
import type { TextProps } from './text.types'

/**
 * A paragraph. Props in, JSX out — the same component the canvas ran is the one the export emits.
 *
 * The only interesting decision here is the measure, and it is the reason this block exists rather
 * than users reaching for a heading at a small size: a paragraph that runs the full width of a 1440 px
 * page is unreadable, and defaulting to 68 characters is what stops a generated page looking generated.
 */
export function Text({
  text,
  size,
  tone,
  measure,
  align,
  columns,
  dropCap,
  balance,
  hidden,
}: TextProps) {
  return (
    <p
      className={textStyles({
        size,
        tone,
        measure,
        align,
        columns: columns as 1 | 2 | 3,
        dropCap,
        balance,
        hidden,
      })}
    >
      {text}
    </p>
  )
}
