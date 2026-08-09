import { ICON_NAMES, type IconName } from '@motion-studio/icons'
import type { ReactElement } from 'react'

import type { ValueControlProps } from '../control-row/index'
import { IconField } from '../icon-field/index'

import { asString } from './coerce'

const NAMES: ReadonlySet<string> = new Set(ICON_NAMES)

/** An unknown name is "no icon" rather than a crash: the registry is what decides what exists. */
export const asIconName = (value: unknown): IconName | '' => {
  const name = asString(value)

  return NAMES.has(name) ? (name as IconName) : ''
}

export type IconControlProps = Omit<ValueControlProps<unknown>, 'value'> & {
  readonly value: unknown
}

/** Its own module so the name list and the picker's grid stay out of the panel's first chunk. */
export function IconControl({ value, ...rest }: IconControlProps): ReactElement {
  return <IconField {...rest} value={asIconName(value)} />
}
