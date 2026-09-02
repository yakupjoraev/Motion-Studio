'use client'

import { Button, Collapsible } from '@motion-studio/ui'
import { useState } from 'react'

export interface ErrorDetailsProps {
  readonly report: string
}

/**
 * The raw error, folded away — UI_GUIDELINES.md § Copy.
 *
 * A primary message says what happened, where, and what to do; a stack trace says none of those
 * things to the person reading it, and putting one in the primary position is how an error state
 * stops being read at all. It is still needed, so it lives one click down.
 *
 * "Nothing is sent automatically" is on the button because a user who is asked to press something
 * labelled *report* is right to assume it phones home. Nothing here does: it is a clipboard write.
 */
export function ErrorDetails({ report }: ErrorDetailsProps) {
  const [copied, setCopied] = useState(false)

  return (
    <Collapsible trigger="Details">
      <div className="flex flex-col gap-2 pt-1">
        <pre className="max-h-40 overflow-auto rounded-sm bg-surface-inset p-2 font-mono text-2xs leading-relaxed">
          {report}
        </pre>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              void navigator.clipboard.writeText(report).then(
                () => setCopied(true),
                // A browser can refuse the clipboard outright, and a button that then does nothing
                // is worse than one that says it could not — the same rule the gallery's Copy has.
                () => setCopied(false),
              )
            }}
            size="sm"
            variant="secondary"
          >
            {copied ? 'Copied' : 'Copy report'}
          </Button>
          <span className="text-2xs text-foreground-subtle">Nothing is sent automatically.</span>
        </div>
      </div>
    </Collapsible>
  )
}
