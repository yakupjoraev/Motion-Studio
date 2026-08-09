import type { RichTextProps as RichTextSchemaProps } from './rich-text.schema'

/** No slot: the content is a tree the document owns, not children the editor nests. */
export type RichTextProps = RichTextSchemaProps
