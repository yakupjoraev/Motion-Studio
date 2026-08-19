import { FIELD_LABEL } from './forms.styles'
import { RequiredMark } from './required-mark'

export interface FieldLabelProps {
  readonly id: string
  readonly htmlFor: string
  readonly label: string
  readonly required: boolean
  /**
   * Whether the label is drawn. `false` puts it in `sr-only` — the element is **always** in the markup, because a
   * placeholder is not a label and a compact form is not an excuse for one. `waitlist-form` is the caller.
   */
  readonly visible?: boolean
}

/**
 * The label. A real `<label>` with `htmlFor`, never a placeholder standing in for one.
 *
 * `id` is here so a control that cannot be named by its label can point at it — `select-field`'s trigger is a
 * button, and a button's accessible name does not come from an associated label.
 */
export function FieldLabel({ id, htmlFor, label, required, visible = true }: FieldLabelProps) {
  return (
    <label className={visible ? FIELD_LABEL : 'sr-only'} htmlFor={htmlFor} id={id}>
      {label}
      {required && <RequiredMark />}
    </label>
  )
}
