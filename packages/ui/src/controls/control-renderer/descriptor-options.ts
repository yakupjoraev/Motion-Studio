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

const isOption = (value: unknown): value is { value: string; label: string } =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as { value?: unknown }).value === 'string' &&
  typeof (value as { label?: unknown }).label === 'string'

/** A control with no legal options renders an empty list, which reads as "nothing to choose". */
export function selectOptions(descriptor: ControlDescriptor): readonly SelectOption[] {
  const raw = bag(descriptor)['options']

  return Array.isArray(raw) ? raw.filter(isOption).map((one) => ({ ...one })) : []
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
