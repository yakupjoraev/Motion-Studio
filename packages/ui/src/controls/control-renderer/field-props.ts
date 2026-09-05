import type { ControlDescriptor } from '@motion-studio/schema'

import type { ControlRendererProps } from './control-renderer.types'
import { optionDecoder, optionNumber, optionString } from './descriptor-options'

/**
 * The three prop groups every branch of the switch spreads. They are built here so the switch reads
 * as a list of controls rather than a list of option lookups, and so "which options does a numeric
 * control take" has one answer instead of six.
 *
 * Every entry is present-or-absent rather than possibly-`undefined`: a control's optional prop and a
 * control's prop set to `undefined` are the same thing to React and different things to
 * `exactOptionalPropertyTypes`.
 */
export function commonProps(props: ControlRendererProps) {
  const { descriptor, onChange, onCommit, slot, disabled, mixed } = props

  return {
    label: descriptor.label,
    // A handler that takes `unknown` satisfies a control that hands it a string: the parameter is
    // contravariant, so no cast is needed in either direction.
    onChange,
    onCommit,
    ...(slot ?? {}),
    ...(disabled === undefined ? {} : { disabled }),
    ...(mixed === undefined ? {} : { mixed: (slot?.mixed ?? false) || mixed }),
  }
}

/**
 * What a choice control — `select`, `segmented` — writes back. The DOM hands every choice over as a
 * string; this returns it in the type the descriptor declared its options in, so a numeric option
 * commits the number the block's schema parses rather than a string it rejects (ADR-351).
 */
export function choiceProps(props: ControlRendererProps) {
  const { descriptor, onChange, onCommit } = props
  const decode = optionDecoder(descriptor)

  return {
    onChange: (next: string) => {
      onChange(decode(next))
    },
    onCommit: (next: string) => {
      onCommit(decode(next))
    },
  }
}

/** What a numeric control is bounded by: the range, the step, the unit it prints, the precision. */
export function boundsProps(descriptor: ControlDescriptor) {
  return {
    ...(optionNumber(descriptor, 'min') === undefined
      ? {}
      : { min: optionNumber(descriptor, 'min') }),
    ...(optionNumber(descriptor, 'max') === undefined
      ? {}
      : { max: optionNumber(descriptor, 'max') }),
    ...(optionNumber(descriptor, 'step') === undefined
      ? {}
      : { step: optionNumber(descriptor, 'step') }),
    ...(optionString(descriptor, 'unit') === undefined
      ? {}
      : { unit: optionString(descriptor, 'unit') }),
    ...(optionNumber(descriptor, 'precision') === undefined
      ? {}
      : { precision: optionNumber(descriptor, 'precision') }),
  }
}

export function textProps(descriptor: ControlDescriptor) {
  return {
    ...(optionNumber(descriptor, 'maxLength') === undefined
      ? {}
      : { maxLength: optionNumber(descriptor, 'maxLength') }),
    ...(optionString(descriptor, 'placeholder') === undefined
      ? {}
      : { placeholder: optionString(descriptor, 'placeholder') }),
  }
}
