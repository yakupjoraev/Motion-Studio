import type { ButtonHTMLAttributes } from 'react'

/**
 * Three states, not two. `UI_GUIDELINES.md` § Multi-selection: with several nodes selected a shared boolean
 * property is on for some of them, and the control has to say so rather than pick a side. Radix maps this to
 * `aria-checked="mixed"`.
 */
export type CheckboxState = boolean | 'indeterminate'

type CheckboxRootAttributes = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'checked' | 'defaultChecked' | 'onChange' | 'type' | 'value'
>

export interface CheckboxProps extends CheckboxRootAttributes {
  readonly checked?: CheckboxState
  readonly defaultChecked?: CheckboxState
  readonly onCheckedChange?: (checked: CheckboxState) => void
  readonly disabled?: boolean
  readonly required?: boolean
  /** Submitted with the form under `name`. Defaults to Radix's `"on"`. */
  readonly value?: string
  readonly name?: string
  /** Required when no visible `Label` is wired to it — every control needs an accessible name. */
  readonly 'aria-label'?: string
  readonly 'aria-labelledby'?: string
}
