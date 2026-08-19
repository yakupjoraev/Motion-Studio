import { z } from 'zod'

import { HINT_MAX_LENGTH, OPTION_MAX_LENGTH, fieldFields, formsFrameFields } from '../forms.schema'

export const MAX_CHOICES = 10
export const MIN_CHOICES = 1

/**
 * Which kind of group this is. It changes the element rather than the styling: a checkbox group answers "any of
 * these", a radio group answers "one of these", and a reader who is offered the wrong one is being asked the
 * wrong question.
 */
export const CHOICE_MODES = ['checkbox', 'radio'] as const

export type ChoiceMode = (typeof CHOICE_MODES)[number]

export const CHOICE_LAYOUTS = ['stack', 'inline'] as const

export type ChoiceLayout = (typeof CHOICE_LAYOUTS)[number]

export const choiceSchema = z.object({
  value: z.string().min(1).max(OPTION_MAX_LENGTH),
  label: z.string().min(1).max(OPTION_MAX_LENGTH),
  /** A line under the choice, for the one that needs qualifying. Empty drops it. */
  hint: z.string().max(HINT_MAX_LENGTH).default(''),
  checked: z.boolean().default(false),
  disabled: z.boolean().default(false),
})

export type Choice = z.infer<typeof choiceSchema>

const DEFAULT_CHOICES: readonly Choice[] = [
  {
    value: 'release-notes',
    label: 'Release notes',
    hint: 'What shipped, once a month.',
    checked: true,
    disabled: false,
  },
  {
    value: 'deep-dives',
    label: 'Engineering deep dives',
    hint: '',
    checked: false,
    disabled: false,
  },
  { value: 'events', label: 'Events and workshops', hint: '', checked: false, disabled: false },
]

export const checkboxFieldSchema = z.object({
  ...fieldFields({
    label: 'What should we send you?',
    hint: 'Pick as many as you like.',
    name: 'topics',
  }),
  mode: z.enum(CHOICE_MODES).default('checkbox'),
  layout: z.enum(CHOICE_LAYOUTS).default('stack'),
  choices: z
    .array(choiceSchema)
    .min(MIN_CHOICES)
    .max(MAX_CHOICES)
    .default([...DEFAULT_CHOICES]),
  ...formsFrameFields(),
})

export type CheckboxFieldProps = z.infer<typeof checkboxFieldSchema>

/**
 * Which choice a radio group starts on.
 *
 * A radio group is one answer, so only the first checked choice counts — several `checked` radios in one group
 * is a document the browser would resolve by taking the last one, which is not what the author saw in the
 * inspector.
 */
export const startingChoice = (mode: ChoiceMode, choices: readonly Choice[]): string | undefined =>
  mode === 'radio' ? choices.find((choice) => choice.checked)?.value : undefined
