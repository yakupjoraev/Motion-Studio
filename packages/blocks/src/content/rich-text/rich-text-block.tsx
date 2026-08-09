import type { RichTextBlock as Block } from '@motion-studio/schema'

import { RichTextInline } from './rich-text-inline'
import { RICH_TEXT_ORDERED, RICH_TEXT_PARAGRAPH, RICH_TEXT_UNORDERED } from './rich-text.styles'

export interface RichTextBlockProps {
  readonly block: Block
}

/** A paragraph or a list. Two shapes, and a real `ul`/`ol`/`li` for the second one. */
export function RichTextBlock({ block }: RichTextBlockProps) {
  if (block.kind === 'paragraph') {
    return (
      <p className={RICH_TEXT_PARAGRAPH}>
        <RichTextInline nodes={block.children} />
      </p>
    )
  }

  const items = block.items.map((item, position) => (
    // biome-ignore lint/suspicious/noArrayIndexKey: the tree has no ids and is replaced wholesale — see rich-text-inline.tsx
    <li key={position}>
      <RichTextInline nodes={item.children} />
    </li>
  ))

  return block.ordered ? (
    <ol className={RICH_TEXT_ORDERED}>{items}</ol>
  ) : (
    <ul className={RICH_TEXT_UNORDERED}>{items}</ul>
  )
}
