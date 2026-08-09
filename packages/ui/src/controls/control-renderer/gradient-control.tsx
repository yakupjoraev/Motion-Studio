import type { Gradient } from '@motion-studio/tokens'
import type { ReactElement } from 'react'

import type { ValueControlProps } from '../control-row/index'
import { GradientField, gradientFromCss, gradientToCss } from '../gradient-field/index'

import { asString } from './coerce'

/** A block stores a gradient as the CSS it exports; the editor works on the parsed form. */
export const asGradient = (value: unknown): Gradient =>
  gradientFromCss(asString(value)) ?? { kind: 'linear', angle: 180, stops: [] }

export type GradientControlProps = Omit<ValueControlProps<unknown>, 'value'> & {
  readonly value: unknown
}

/**
 * Its own module so the gradient track and the colour pickers inside it are a chunk of their own —
 * the panel's first chunk holds the switch, not every editor the switch can reach.
 */
export function GradientControl({
  value,
  onChange,
  onCommit,
  ...rest
}: GradientControlProps): ReactElement {
  return (
    <GradientField
      {...rest}
      onChange={(next) => onChange(gradientToCss(next))}
      onCommit={(next) => onCommit(gradientToCss(next))}
      value={asGradient(value)}
    />
  )
}
