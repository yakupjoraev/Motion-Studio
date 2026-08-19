'use client'

import { useEffect, useRef } from 'react'

import { FORM_SUCCESS, FORM_SUCCESS_BODY, FORM_SUCCESS_TITLE } from './forms.styles'

export interface SuccessPanelProps {
  readonly title: string
  readonly body: string
}

/**
 * What replaces the form once it has been sent.
 *
 * It **takes focus**, and that is the requirement rather than a nicety: the form the reader was in has just been
 * removed from the document, so their focus would otherwise fall to the top of the page with no announcement that
 * anything happened. `tabIndex={-1}` makes the panel focusable programmatically without adding a tab stop.
 *
 * An `<output>` rather than a `div` with `role="status"`: the element carries that role implicitly, which is the
 * first rule of ARIA and one attribute fewer to get wrong.
 *
 * The effect runs once, on mount, because the panel only ever exists after a successful submission.
 */
export function SuccessPanel({ title, body }: SuccessPanelProps) {
  const panel = useRef<HTMLOutputElement>(null)

  useEffect(() => {
    panel.current?.focus()
  }, [])

  return (
    <output className={FORM_SUCCESS} data-testid="form-success" ref={panel} tabIndex={-1}>
      <p className={FORM_SUCCESS_TITLE}>{title}</p>
      {body !== '' && <p className={FORM_SUCCESS_BODY}>{body}</p>}
    </output>
  )
}
