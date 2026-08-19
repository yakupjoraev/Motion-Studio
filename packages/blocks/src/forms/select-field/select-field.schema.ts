import { z } from 'zod'

import {
  OPTION_MAX_LENGTH,
  PLACEHOLDER_MAX_LENGTH,
  fieldFields,
  formsFrameFields,
} from '../forms.schema'

export const MAX_OPTIONS = 12
export const MIN_OPTIONS = 1

/**
 * An option is a value and what the reader sees.
 *
 * The value is `min(1)` because Radix Select reserves the empty string for "nothing selected": an option
 * carrying it would be an option the reader can choose and the component cannot represent.
 */
export const selectOptionSchema = z.object({
  value: z.string().min(1).max(OPTION_MAX_LENGTH),
  label: z.string().min(1).max(OPTION_MAX_LENGTH),
})

export type SelectOption = z.infer<typeof selectOptionSchema>

const DEFAULT_OPTIONS: readonly SelectOption[] = [
  { value: 'react', label: 'React' },
  { value: 'next', label: 'Next.js' },
  { value: 'html', label: 'Static HTML' },
  { value: 'json', label: 'JSON only' },
]

export const selectFieldSchema = z.object({
  ...fieldFields({
    label: 'Export target',
    hint: 'You can change this later in the export dialog.',
    name: 'target',
  }),
  options: z
    .array(selectOptionSchema)
    .min(MIN_OPTIONS)
    .max(MAX_OPTIONS)
    .default([...DEFAULT_OPTIONS]),
  /** What the trigger shows before a choice is made. Empty leaves the trigger blank, which is worse. */
  placeholder: z.string().min(1).max(PLACEHOLDER_MAX_LENGTH).default('Choose a target'),
  /** Which option starts selected, by value. Empty starts with the placeholder. */
  defaultValue: z.string().max(OPTION_MAX_LENGTH).default(''),
  ...formsFrameFields(),
})

export type SelectFieldProps = z.infer<typeof selectFieldSchema>

/** The starting value Radix's uncontrolled root takes, or nothing at all when the author chose none. */
export const startingValue = (
  defaultValue: string,
  options: readonly SelectOption[],
): string | undefined =>
  options.some((option) => option.value === defaultValue) ? defaultValue : undefined
