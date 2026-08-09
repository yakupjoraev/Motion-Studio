import type { CodeBlockProps as CodeBlockSchemaProps } from './code-block.schema'

/** No slot: the code is a string prop, so it stays copyable and exportable as itself. */
export type CodeBlockProps = CodeBlockSchemaProps
