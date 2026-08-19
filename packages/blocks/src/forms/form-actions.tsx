import { LoadingIcon } from '@motion-studio/icons'

import { controlStyles } from '../interactive/interactive.styles'

import type { FormState } from './forms.schema'
import { FORM_ACTIONS, formMessageStyles } from './forms.styles'

export interface FormActionsProps {
  readonly state: FormState
  readonly submitLabel: string
  readonly submittingLabel: string
  /** What the reader is told when the handler failed. Not their fault, so not a field's error. */
  readonly failureMessage: string
  readonly messageId: string
  readonly note: string
  readonly noteClassName: string
}

/**
 * The submit button and what the form as a whole is saying.
 *
 * The button is drawn from `interactive`'s `controlStyles` rather than from a fourth submit-button implementation:
 * a form and a `button` block on the same exported page have to be the same control, and neither category can be
 * the one that decides that alone.
 *
 * Only the button is disabled while the form is submitting — not the fields. Disabling the field the reader is in
 * takes it out of the tab order under their cursor, and losing focus mid-submission is worse than the edit the
 * disabled state was protecting.
 *
 * The form-level message is a live region that is always mounted, for the reason the field error is: a region
 * added at the same moment as its text is one most screen readers do not read.
 */
export function FormActions({
  state,
  submitLabel,
  submittingLabel,
  failureMessage,
  messageId,
  note,
  noteClassName,
}: FormActionsProps) {
  const busy = state === 'submitting'

  return (
    <>
      <div className={FORM_ACTIONS}>
        <button
          aria-busy={busy ? true : undefined}
          className={controlStyles({ variant: 'primary', size: 'md' })}
          data-testid="form-submit"
          disabled={busy}
          type="submit"
        >
          {busy && <LoadingIcon aria-hidden="true" className="ms-spin shrink-0" size={18} />}
          {busy ? submittingLabel : submitLabel}
        </button>

        {note !== '' && <p className={noteClassName}>{note}</p>}
      </div>

      <p
        aria-live={state === 'error' ? 'assertive' : 'polite'}
        className={formMessageStyles({ tone: state })}
        data-state={state}
        data-testid="form-message"
        id={messageId}
      >
        {state === 'error' ? failureMessage : ''}
      </p>
    </>
  )
}
