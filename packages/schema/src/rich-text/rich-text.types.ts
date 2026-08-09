/**
 * The stored shape of rich text — FILE_FORMAT.md § Security, the rich-text row, taken literally: a
 * *restricted AST*, not markup.
 *
 * The difference is the whole point. A sanitised HTML string still has to reach the page through
 * `innerHTML`, so the security property depends on the sanitiser being right about every input a
 * browser will ever parse. An AST reaches the page as React elements, so there is no HTML parser on
 * the render path at all: a node the parser did not produce cannot be rendered, whatever a payload
 * looked like. ADR-122 records why that is worth a second representation.
 *
 * The shape is deliberately shallow. Marks are a set on a text run rather than nested elements, and a
 * link's children are runs rather than arbitrary nodes — so the tree is two levels deep by
 * construction and nothing recursive has to be validated, rendered, or reasoned about.
 */
export const RICH_TEXT_MARKS = ['strong', 'em', 'code'] as const

export type RichTextMark = (typeof RICH_TEXT_MARKS)[number]

export interface RichTextRun {
  readonly text: string
  readonly marks: readonly RichTextMark[]
}

export interface RichTextLink {
  readonly href: string
  readonly runs: readonly RichTextRun[]
}

/** A run of text, or a link containing runs. Nothing else is inline. */
export type RichTextInline =
  | { readonly kind: 'run'; readonly run: RichTextRun }
  | { readonly kind: 'link'; readonly link: RichTextLink }

export interface RichTextParagraph {
  readonly kind: 'paragraph'
  readonly children: readonly RichTextInline[]
}

export interface RichTextListItem {
  readonly children: readonly RichTextInline[]
}

export interface RichTextList {
  readonly kind: 'list'
  readonly ordered: boolean
  readonly items: readonly RichTextListItem[]
}

/** A paragraph or a list. The prompt's model is these two and no headings, quotes or tables. */
export type RichTextBlock = RichTextParagraph | RichTextList

export type RichTextDocument = readonly RichTextBlock[]
