'use client'

import { useEffect, useState } from 'react'

export type CopyTone = 'accent' | 'quiet'

export interface CopyButtonProps {
  readonly text: string
  readonly label: string
  /** `quiet` is the docs' code fences: one per sample, so it cannot carry the accent. */
  readonly tone?: CopyTone
  readonly announcement?: string
  readonly testId?: string
}

const TONE_CLASS: Readonly<Record<CopyTone, string>> = {
  accent:
    'h-9 rounded-md bg-accent px-3 font-medium text-foreground-onAccent text-sm hover:bg-accent-hover',
  quiet:
    'h-6 rounded-sm border border-border-subtle bg-surface-2 px-2 font-mono text-2xs text-foreground-muted uppercase tracking-[0.14em] hover:border-border hover:text-foreground',
}

/**
 * It copies and says so in a live region rather than only in its own label, because a visitor who
 * pressed it with a screen reader has no other way to learn that anything happened.
 *
 * The failure path is real and is not a crash: a browser can refuse clipboard access outright, and a
 * button that then does nothing is worse than one that says it could not.
 */
export function CopyButton({
  text,
  label,
  tone = 'accent',
  announcement = 'Component source copied to the clipboard',
  testId = 'copy-react',
}: CopyButtonProps) {
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
        className={`inline-flex items-center gap-2 outline-none transition-colors focus-visible:shadow-focus ${TONE_CLASS[tone]}`}
        data-testid={testId}
        onClick={copy}
        type="button"
      >
        {state === 'copied' ? 'Copied' : label}
      </button>

      <span aria-live="polite" className="sr-only">
        {state === 'copied' ? announcement : ''}
        {state === 'failed' ? 'The browser would not give access to the clipboard' : ''}
      </span>
    </>
  )
}
