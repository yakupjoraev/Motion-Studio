import { FIELD_ERROR, FIELD_HINT } from './forms.styles'

export interface FieldHintProps {
  readonly id: string
  readonly hint: string
}

/** The hint. Rendered only when there is one, so `aria-describedby` never points at an empty element. */
export function FieldHint({ id, hint }: FieldHintProps) {
  if (hint === '') {
    return null
  }

  return (
    <p className={FIELD_HINT} data-testid="field-hint" id={id}>
      {hint}
    </p>
  )
}

export interface FieldErrorProps {
  readonly id: string
  readonly error: string
}

/**
 * The error.
 *
 * **Always rendered, empty or not.** A `role="alert"` element inserted into the DOM at the same moment as its
 * text is a region most screen readers do not announce; one that is already there announces its text the
 * instant it arrives. That is the whole reason this component has no early return, and it is why the element
 * keeps a minimum height — a message appearing between two fields would otherwise push the rest of the form
 * down while the reader is tabbing through it.
 */
export function FieldError({ id, error }: FieldErrorProps) {
  return (
    <p className={FIELD_ERROR} data-testid="field-error" id={id} role="alert">
      {error}
    </p>
  )
}
