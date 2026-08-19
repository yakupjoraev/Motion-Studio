import type { WaitlistFormShape, WaitlistValues } from './waitlist-form.schema'

/**
 * The handler is a prop and not a schema field, because a function is not a value a `.motion` document can hold.
 * It defaults to a no-op, and the codegen descriptor's note is what tells the reader of the exported file to
 * replace it.
 */
export type WaitlistFormProps = WaitlistFormShape & {
  readonly onSubmit?: ((values: WaitlistValues) => void | Promise<void>) | undefined
}
