import type { UseFormRegisterReturn } from 'react-hook-form'

import { HONEYPOT } from './forms.styles'

/** The name the field is submitted under. A plausible one: a bot looking for a contact field should find this. */
export const HONEYPOT_NAME = 'reference'

export interface HoneypotProps {
  readonly id: string
  readonly registration: UseFormRegisterReturn
}

/**
 * The spam trap.
 *
 * A real, submittable input that no person will ever fill in. Three things make it work at once, and each of the
 * three is easy to get wrong:
 *
 *   - it is **off-screen**, not `display: none` and not `visibility: hidden`. A bot that reads the stylesheet
 *     skips a field it can see is hidden, and the whole point of the field is that a bot fills it in;
 *   - the wrapper is `aria-hidden` and the input is `tabIndex={-1}`, so a screen-reader user is never offered it
 *     and a keyboard user never lands on it. A trap that catches assistive technology catches the wrong people;
 *   - `autoComplete="off"`, so a browser's own autofill does not fill it in on the reader's behalf and make a real
 *     person look like a bot.
 *
 * A filled trap is treated as a submission that succeeds and goes nowhere. Telling a bot it failed teaches it
 * what to change.
 */
export function Honeypot({ id, registration }: HoneypotProps) {
  return (
    <div aria-hidden="true" className={HONEYPOT} data-testid="honeypot">
      <label htmlFor={id}>Reference</label>
      <input {...registration} autoComplete="off" id={id} tabIndex={-1} type="text" />
    </div>
  )
}
