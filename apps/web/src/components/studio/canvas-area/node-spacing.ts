import { SPACE_PX, type SpaceScale } from '@motion-studio/blocks'
import type { NodeSpacing } from '@motion-studio/canvas'

const edges = (value: number) => ({ top: value, right: value, bottom: value, left: value })

const NONE = edges(0)

/**
 * ADR-099: the `Alt` overlay reports the document, not the layout. A block's padding is a name from
 * the space scale, and `SPACE_PX` is the same number the class map spends — a test in
 * `packages/blocks` holds the two together, so this is a lookup rather than a second opinion.
 */
export function nodeSpacing(props: Readonly<Record<string, unknown>>): NodeSpacing | undefined {
  const padding = props['padding']

  if (typeof padding !== 'string' || !(padding in SPACE_PX)) {
    return undefined
  }

  // No block declares a margin yet: spacing between blocks is the container's `gap`, which belongs
  // to the parent and is drawn there rather than on each child.
  return { padding: edges(SPACE_PX[padding as SpaceScale]), margin: NONE }
}
