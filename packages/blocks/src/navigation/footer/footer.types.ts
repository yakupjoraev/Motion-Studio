import type { ReactNode } from 'react'

import type { FooterProps as FooterSchemaProps } from './footer.schema'

/**
 * The one slot in the category. A footer's signup form is a block the user places rather than a field
 * this one reimplements — `newsletter-form` already owns the validation and the live region.
 */
export type FooterProps = FooterSchemaProps & {
  readonly newsletter?: ReactNode
  readonly children?: ReactNode
}
