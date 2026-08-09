'use client'

import { useEffect, useRef, useState } from 'react'

import { CODE_COPY } from './code-block.styles'

/** UI_GUIDELINES.md § Timing: the confirmation holds long enough to read and then gets out of the way. */
const CONFIRMATION_MS = 1_200

export interface CopyButtonProps {
  /** What lands on the clipboard — the source, never the rendered text with its line numbers in it. */
  readonly value: string
}

/**
 * The copy button and the whole of its state. It is its own component because it is the only stateful
 * thing in a code block: keeping it here means `CodeBlock` renders from props alone and this file is
 * the only place a timer has to be cleaned up.
 */
export function CopyButton({ value }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timer.current !== null) {
        clearTimeout(timer.current)
      }
    },
    [],
  )

  const copy = (): void => {
    // A refused clipboard is an answer, not an error: the button simply does not confirm.
    void navigator.clipboard?.writeText(value).then(
      () => {
        setCopied(true)

        if (timer.current !== null) {
          clearTimeout(timer.current)
        }

        timer.current = setTimeout(() => setCopied(false), CONFIRMATION_MS)
      },
      () => undefined,
    )
  }

  return (
    <button className={CODE_COPY} onClick={copy} type="button">
      {copied ? 'Copied' : 'Copy'}
      <span aria-live="polite" className="sr-only">
        {copied ? 'Copied to clipboard' : ''}
      </span>
    </button>
  )
}
