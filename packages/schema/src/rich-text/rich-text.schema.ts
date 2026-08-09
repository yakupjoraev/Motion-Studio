import { type ZodType, type ZodTypeDef, z } from 'zod'

import { isSafeUrl } from '../sanitize/urls'

import { RICH_TEXT_MARKS, type RichTextDocument } from './rich-text.types'

/**
 * The AST as a Zod schema, so a block's `propsSchema` can hold rich text and invariant 7 validates a
 * pasted or imported value the same way it validates every other prop.
 *
 * The `href` refinement is the scheme allowlist, applied at the type boundary rather than only in the
 * parser. A value can reach a document without passing through the parser — an import, a clipboard
 * payload, a hand-edited file — and this is the check that holds on all of those paths.
 */
export const MAX_RUN_LENGTH = 5_000
export const MAX_HREF_LENGTH = 2_048
export const MAX_BLOCKS = 200
export const MAX_CHILDREN = 400
export const MAX_LIST_ITEMS = 200

export const richTextRunSchema = z.object({
  text: z.string().max(MAX_RUN_LENGTH),
  marks: z.array(z.enum(RICH_TEXT_MARKS)).max(RICH_TEXT_MARKS.length),
})

export const richTextLinkSchema = z.object({
  href: z.string().max(MAX_HREF_LENGTH).refine(isSafeUrl, {
    message: 'The link uses a scheme that is not allowed',
  }),
  runs: z.array(richTextRunSchema).max(MAX_CHILDREN),
})

export const richTextInlineSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('run'), run: richTextRunSchema }),
  z.object({ kind: z.literal('link'), link: richTextLinkSchema }),
])

export const richTextParagraphSchema = z.object({
  kind: z.literal('paragraph'),
  children: z.array(richTextInlineSchema).max(MAX_CHILDREN),
})

export const richTextListSchema = z.object({
  kind: z.literal('list'),
  ordered: z.boolean(),
  items: z
    .array(z.object({ children: z.array(richTextInlineSchema).max(MAX_CHILDREN) }))
    .max(MAX_LIST_ITEMS),
})

export const richTextBlockSchema = z.discriminatedUnion('kind', [
  richTextParagraphSchema,
  richTextListSchema,
])

/**
 * Annotated with the hand-written type rather than left to inference, so the *documented* shape in
 * `rich-text.types.ts` is the one every consumer sees. Zod infers mutable arrays; the AST is readonly,
 * and a block's prop type comes from this schema — without the annotation the two would disagree at
 * every call site that passes a parsed value back in.
 */
export const richTextDocumentSchema: ZodType<RichTextDocument, ZodTypeDef, unknown> = z
  .array(richTextBlockSchema)
  .max(MAX_BLOCKS)
