import type { NewsletterFormShape } from './newsletter-form.schema'

/**
 * The handler is a prop and not a schema field, because a function is not a value a `.motion` document can
 * hold. It defaults to a no-op, and the codegen descriptor's note is what tells the reader of the exported
 * file to replace it — prompt 38's requirement, and the honest shape of a block that must not invent a
 * backend.
 */
export type NewsletterFormProps = NewsletterFormShape & {
  readonly onSubmit?: ((email: string) => void | Promise<void>) | undefined
}
