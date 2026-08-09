import { parseRichText, richTextDocumentSchema } from '@motion-studio/schema'
import { z } from 'zod'

import { alignment, visibility } from '../../scales'

export const RICH_TEXT_SIZES = ['sm', 'md', 'lg'] as const

export type RichTextSize = (typeof RICH_TEXT_SIZES)[number]

/**
 * The prop is the **AST**, not markup — ADR-122. That is what lets the component render React elements
 * instead of reaching for `innerHTML`, and it is why a payload cannot survive: the value a document
 * carries has no shape that could express one.
 *
 * `parseRichText` is used here only to write the *default*, which is authored as markup because
 * markup is what a human can read in a source file.
 */
export const richTextSchema = z.object({
  content: richTextDocumentSchema.default(
    parseRichText(
      '<p>The editor stores a <strong>restricted tree</strong>, not markup. Bold, italic, ' +
        '<code>inline code</code>, a <a href="/docs">link</a>, and lists survive a paste — everything ' +
        'else keeps its text and loses its tags.</p>',
    ),
  ),
  size: z.enum(RICH_TEXT_SIZES).default('md'),
  measure: z.enum(['narrow', 'default', 'wide', 'full']).default('default'),
  align: alignment.default('start'),
  hidden: visibility,
})

export type RichTextProps = z.infer<typeof richTextSchema>
