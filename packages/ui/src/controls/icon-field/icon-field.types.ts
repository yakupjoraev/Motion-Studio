import type { IconName } from '@motion-studio/icons'

import type { ValueControlProps } from '../control-row/index'

/** The empty string is "no icon", which is a legal value for an optional slot in a block. */
export type IconValue = IconName | ''

export interface IconFieldProps extends ValueControlProps<IconValue> {
  /** Narrows the picker to a subset of the registry. Absent means the whole set. */
  readonly names?: readonly IconName[] | undefined
}
