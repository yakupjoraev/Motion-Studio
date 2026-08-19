import type { ReactNode } from 'react'

import type { FieldIds } from './field-ids'
import { FieldLabel } from './field-label'
import { FieldError, FieldHint } from './field-messages'
import { FORM_FIELD } from './forms.styles'

export interface FieldShellProps {
  readonly ids: FieldIds
  readonly label: string
  readonly hint: string
  readonly error: string
  readonly required: boolean
  /** Whether the label is drawn. It is always in the markup — see `FieldLabel`. */
  readonly labelVisible?: boolean
  /** The control itself, already wired to `ids` by its own block. */
  readonly children: ReactNode
}

/**
 * Label, control, hint, error — in that order, in one place.
 *
 * Every field block in the category renders through this, which is what makes the structure prompt 41 specifies
 * one implementation rather than five transcriptions of it. The order is not cosmetic: `aria-describedby` lists
 * the hint before the error, and a reader moving through the document with a screen reader's virtual cursor
 * meets the elements in the order they are announced in.
 */
export function FieldShell({
  ids,
  label,
  hint,
  error,
  required,
  labelVisible = true,
  children,
}: FieldShellProps) {
  return (
    <div className={FORM_FIELD} data-invalid={error !== ''} data-testid="field">
      <FieldLabel
        htmlFor={ids.fieldId}
        id={ids.labelId}
        label={label}
        required={required}
        visible={labelVisible}
      />
      {children}
      <FieldHint hint={hint} id={ids.hintId} />
      <FieldError error={error} id={ids.errorId} />
    </div>
  )
}
