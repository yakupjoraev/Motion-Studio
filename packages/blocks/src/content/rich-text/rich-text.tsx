import { RichTextBlock } from './rich-text-block'
import { richTextStyles } from './rich-text.styles'
import type { RichTextProps } from './rich-text.types'

/**
 * Rich text, rendered from the AST as React elements.
 *
 * **There is no `dangerouslySetInnerHTML` anywhere in this directory, and that is the entire security
 * argument.** FILE_FORMAT.md § Security calls rich text the most likely XSS vector in the product; a
 * sanitised HTML string would still be parsed by the browser on the render path, so its safety would
 * depend on the sanitiser agreeing with a browser about every malformed input ever written. Rendering
 * an AST removes the parser instead of trying to out-argue it: the five elements these components can
 * produce are the only ones that exist, whatever a document contains. ADR-122.
 */
export function RichText({ content, size, measure, align, hidden }: RichTextProps) {
  return (
    <div className={richTextStyles({ size, measure, align, hidden })} data-testid="rich-text">
      {content.map((block, position) => (
        <RichTextBlock
          block={block}
          // biome-ignore lint/suspicious/noArrayIndexKey: the tree has no ids and is replaced wholesale — see rich-text-inline.tsx
          key={position}
        />
      ))}
    </div>
  )
}
