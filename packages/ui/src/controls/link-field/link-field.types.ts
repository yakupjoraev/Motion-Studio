import type { ValueControlProps } from '../control-row/index'
import type { LinkTarget } from './link-url'

/** The three properties `COMPONENT_LIBRARY.md` § Control kinds names for the `link` kind. */
export interface LinkValue {
  readonly href: string
  readonly target: LinkTarget
  readonly rel: readonly string[]
}

export type LinkFieldProps = ValueControlProps<LinkValue>
