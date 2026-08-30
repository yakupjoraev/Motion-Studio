'use client'

import { useEffect, useState } from 'react'

export interface CopyButtonProps {
  readonly text: string
  readonly label: string
}

/**
 * The one button `prompts/52` puts in the first screenful. It copies the printed component and says
 * so in a live region rather than only in its own label, because a visitor who pressed it with a
 * screen reader has no other way to learn that anything happened.
 *
 * The failure path is real and is not a crash: a browser can refuse clipboard access outright, and a
 * button that then does nothing is worse than one that says it could not.
 */
export function CopyButton({ text, label }: CopyButtonProps) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')

  useEffect(() => {
    if (state === 'idle') {
      return
    }

    const timer = window.setTimeout(() => setState('idle'), 2000)

    return () => window.clearTimeout(timer)
  }, [state])

  const copy = (): void => {
    navigator.clipboard.writeText(text).then(
      () => setState('copied'),
      () => setState('failed'),
    )
  }

  return (
    <>
      <button
        className="inline-flex h-9 items-center gap-2 rounded-md bg-accent px-3 font-medium text-foreground-onAccent text-sm outline-none transition-colors hover:bg-accent-hover focus-visible:shadow-focus"
        data-testid="copy-react"
        onClick={copy}
        type="button"
      >
        {state === 'copied' ? 'Copied' : label}
      </button>

      <span aria-live="polite" className="sr-only">
        {state === 'copied' ? 'Component source copied to the clipboard' : ''}
        {state === 'failed' ? 'The browser would not give access to the clipboard' : ''}
      </span>
    </>
  )
}
