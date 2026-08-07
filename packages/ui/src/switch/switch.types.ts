import type { ButtonHTMLAttributes } from 'react'

/** `onChange` is dropped: it would be a prop that silently never fires. */
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
  readonly name?: string | undefined
  /** Required when no visible `Label` is wired to it — every control needs an accessible name. */
  readonly 'aria-label'?: string | undefined
  readonly 'aria-labelledby'?: string | undefined
}
