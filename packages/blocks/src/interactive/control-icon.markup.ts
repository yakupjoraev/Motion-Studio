import type { MarkupElement } from '@motion-studio/schema'

import { iconMarkup } from '../markup/icon'

export interface ControlIconMarkupInput {
  readonly name: string
  readonly size: number
  readonly className?: string | undefined
}

/**
 * `ControlIcon` as markup, for the eight blocks in the category that take a glyph. Always hidden from
 * assistive technology: every call site is a control that carries its own accessible name, so a
 * labelled glyph inside one would announce twice.
 */
export const controlIconMarkup = ({
  name,
  size,
  className,
}: ControlIconMarkupInput): MarkupElement | null => iconMarkup({ name, size, className })
