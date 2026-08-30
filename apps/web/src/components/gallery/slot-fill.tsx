import type { BlockDefinition } from '@motion-studio/schema'
import type { ReactNode } from 'react'

/**
 * What a container shows when the catalogue has nothing to put in it.
 *
 * Thirteen blocks in the registry own slots, every one of them with `minChildren: 0` and none with
 * `defaultChildren`: a `section` with nothing inside it is a valid `section`, and the studio is where
 * a user fills it. A preview that honoured that literally would show three empty rectangles at the
 * top of the catalogue, which says nothing about what a `section` does — the thing a layout block
 * *is* is the arrangement, and an arrangement of nothing has no shape.
 *
 * So the picture gets something to arrange, and says that it is a placeholder rather than pretending
 * to be content. The children are positional because that is how the canvas passes them (ADR in
 * `columns.tsx`: a block reads its named slots and falls back to child order).
 */
export function slotFill(definition: BlockDefinition): ReactNode {
  if (definition.slots.length === 0) {
    return undefined
  }

  const count = Math.max(2, definition.slots.length)

  return Array.from({ length: count }, (_, index) => (
    // biome-ignore lint/suspicious/noArrayIndexKey: the placeholders are a fixed-length sequence with nothing to identify them by
    <SlotPlaceholder key={index} />
  ))
}

/**
 * A dashed tile and no label. A card scales its stage to about a third, so any words in here are
 * four pixels tall — the shape is the whole message and the words were only noise.
 */
function SlotPlaceholder() {
  return (
    <div className="min-h-32 flex-1 rounded-lg border-2 border-border-subtle border-dashed bg-surface-1/50" />
  )
}
