import type { MarkupElement } from '@motion-studio/schema'

import { iconMarkup } from '../markup/icon'

export interface NavIconMarkupInput {
  readonly name: string
  readonly size?: number
  readonly className?: string | undefined
}

/**
 * `NavIcon` as markup: the glyph itself, inline. A name the set does not know draws nothing, which is
 * what the component does with one — a document's string never reaches module resolution
 * (FILE_FORMAT.md § Security), and it must not start doing so on the way out of the studio either.
 */
export const navIconMarkup = ({
  name,
  size = 18,
  className,
}: NavIconMarkupInput): MarkupElement | null => iconMarkup({ name, size, className })
