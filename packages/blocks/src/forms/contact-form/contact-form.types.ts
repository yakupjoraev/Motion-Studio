import type { ContactFormShape, ContactValues } from './contact-form.schema'

/**
 * The handler is a prop and not a schema field, because a function is not a value a `.motion` document can hold.
 * It defaults to a no-op, and the codegen descriptor's note is what tells the reader of the exported file to
 * replace it — the honest shape of a block that must not invent a backend.
 */
export type ContactFormProps = ContactFormShape & {
  readonly onSubmit?: ((values: ContactValues) => void | Promise<void>) | undefined
}
