'use client'

import { BREAKPOINTS } from '@motion-studio/schema'
import { Segmented } from '@motion-studio/ui'

/** Three of the six — a phone, a tablet and a desktop. The other three answer the same question. */
export const PREVIEW_WIDTHS = ['base', 'md', 'xl'] as const

export type PreviewWidth = (typeof PREVIEW_WIDTHS)[number]

const isWidth = (value: string): value is PreviewWidth =>
  (PREVIEW_WIDTHS as readonly string[]).includes(value)

const OPTIONS = PREVIEW_WIDTHS.map((id) => ({
  value: id,
  label: `${BREAKPOINTS[id].label}, ${BREAKPOINTS[id].frame} pixels`,
  content: `${BREAKPOINTS[id].label} ${BREAKPOINTS[id].frame}`,
}))

export interface ViewportSwitcherProps {
  readonly value: PreviewWidth
  readonly onChange: (next: PreviewWidth) => void
}

/**
 * Which width the block is laid out at. Not which width the *frame* is — the frame keeps its room and
 * the stage inside it changes, so switching from `xl` to `base` is a component reflowing rather than a
 * window resizing, which is the difference between showing a responsive component and showing a box.
 *
 * `Segmented` from `@motion-studio/ui`, not three buttons carrying `role="radio"`: it is a Radix
 * RadioGroup with roving tabindex and an animated indicator, and the studio's inspector already uses
 * it for this exact shape of choice. Two implementations of one control is what `prompts/52` spends a
 * paragraph forbidding, and the paragraph is about more than the fields.
 */
export function ViewportSwitcher({ value, onChange }: ViewportSwitcherProps) {
  return (
    <Segmented
      aria-label="Preview width"
      onValueChange={(next) => {
        if (isWidth(next)) {
          onChange(next)
        }
      }}
      options={OPTIONS}
      value={value}
    />
  )
}
