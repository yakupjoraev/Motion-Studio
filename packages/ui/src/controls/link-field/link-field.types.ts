import type { ValueControlProps } from '../control-row/index'
import type { LinkTarget } from './link-url'

/** The three properties `COMPONENT_LIBRARY.md` § Control kinds names for the `link` kind. */
export interface LinkValue {
  readonly href: string
  readonly target: LinkTarget
  readonly rel: readonly string[]
}

export interface LinkFieldProps extends ValueControlProps<LinkValue> {
  /**
   * The prop behind this control holds a bare href string, so `target` and `rel` have nowhere to be
   * stored and nothing prints them — ADR-354. They are hidden rather than shown and ignored.
   */
  readonly hrefOnly?: boolean | undefined
}
