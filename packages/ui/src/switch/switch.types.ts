import type { ButtonHTMLAttributes } from 'react'

/**
 * `value` and `onChange` are dropped from the button attributes and replaced: Radix types `value` as a
 * `string` for form submission, and `onCheckedChange` is the only change handler the control has. Leaving
 * React's `onChange` reachable would offer a prop that silently never fires.
 */
type SwitchRootAttributes = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onChange' | 'type' | 'value'
>

export interface SwitchProps extends SwitchRootAttributes {
  readonly checked?: boolean
  readonly defaultChecked?: boolean
  readonly onCheckedChange?: (checked: boolean) => void
  readonly disabled?: boolean
  readonly required?: boolean
  /** Submitted with the form under `name`. Defaults to Radix's `"on"`. */
  readonly value?: string
  readonly name?: string
  /** Required when no visible `Label` is wired to it — every control needs an accessible name. */
  readonly 'aria-label'?: string
  readonly 'aria-labelledby'?: string
}
