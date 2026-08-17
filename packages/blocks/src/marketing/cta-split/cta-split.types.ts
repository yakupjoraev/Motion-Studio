import type { CtaSplitProps as CtaSplitSchemaProps } from './cta-split.schema'

/** The handler is a prop rather than a schema field, for the reason `newsletter-form` states. */
export type CtaSplitProps = CtaSplitSchemaProps & {
  readonly onSubmit?: ((email: string) => void | Promise<void>) | undefined
}
