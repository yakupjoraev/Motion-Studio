import type { ButtonHTMLAttributes } from 'react'

/** Three states: § Multi-selection needs "on for some of the selected nodes". Radix maps it to `mixed`. */
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
