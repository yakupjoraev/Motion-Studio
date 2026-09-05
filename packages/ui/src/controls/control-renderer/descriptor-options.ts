import type { ControlDescriptor } from '@motion-studio/schema'

import type { SegmentedOption } from '../../segmented/index'
import type { SelectOption } from '../../select/index'

/**
 * `ControlDescriptor.options` is `Record<string, unknown>` by design — each kind owns its own shape,
 * and typing the union in `schema` would put every control's props in the package `codegen` imports.
 * These readers are where that `unknown` stops: a value of the wrong shape falls back rather than
 * reaching a control that would then render `NaN`.
 */
const bag = (descriptor: ControlDescriptor): Readonly<Record<string, unknown>> =>
  descriptor.options ?? {}

export const optionNumber = (descriptor: ControlDescriptor, key: string): number | undefined => {
  const value = bag(descriptor)[key]

  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

export const optionString = (descriptor: ControlDescriptor, key: string): string | undefined => {
  const value = bag(descriptor)[key]

  return typeof value === 'string' ? value : undefined
}

export const optionBoolean = (descriptor: ControlDescriptor, key: string): boolean | undefined => {
  const value = bag(descriptor)[key]

  return typeof value === 'boolean' ? value : undefined
}

/**
 * A choice's value reaches the DOM as a string, but a descriptor may legitimately declare it as a
 * number — a heading level is `2`, not `'2'`, because that is what the block's schema parses and what
 * the printer emits. So a number is a legal option value here, printed as a string by `selectOptions`
 * and turned back into a number by `optionDecoder` when the choice is committed (ADR-351).
 */
const isOption = (value: unknown): value is { value: string | number; label: string } =>
  typeof value === 'object' &&
  value !== null &&
  (typeof (value as { value?: unknown }).value === 'string' ||
    typeof (value as { value?: unknown }).value === 'number') &&
  typeof (value as { label?: unknown }).label === 'string'

/** A control with no legal options renders an empty list, which reads as "nothing to choose". */
export function selectOptions(descriptor: ControlDescriptor): readonly SelectOption[] {
  const raw = bag(descriptor)['options']

  return Array.isArray(raw)
    ? raw.filter(isOption).map((one) => ({ ...one, value: String(one.value) }))
    : []
}

/**
 * The inverse of the `String()` above: what a control hands back, in the type the descriptor declared
 * it in. A value the descriptor never offered passes through unchanged rather than being invented —
 * the store's guard is what rejects it, and it does so with the value the user's action produced.
 */
export function optionDecoder(descriptor: ControlDescriptor): (chosen: string) => string | number {
  const raw = bag(descriptor)['options']
  const numeric = new Map<string, number>()

  if (Array.isArray(raw)) {
    for (const one of raw) {
      if (isOption(one) && typeof one.value === 'number') {
        numeric.set(String(one.value), one.value)
      }
    }
  }

  return (chosen) => numeric.get(chosen) ?? chosen
}

/** A segmented option needs its own visible content; a scale name is its own best rendering. */
export function segmentedOptions(descriptor: ControlDescriptor): readonly SegmentedOption[] {
  return selectOptions(descriptor).map((one) => ({
    value: one.value,
    label: one.label,
    content: one.label,
  }))
}

/** The variable a block reads for this prop, when it reads one — ADR-111. */
export const cssVariable = (descriptor: ControlDescriptor): string | undefined => {
  const value = optionString(descriptor, 'cssVar')

  return value?.startsWith('--') === true ? value : undefined
}
