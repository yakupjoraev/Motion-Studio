'use client'

import { Button } from '@motion-studio/ui'
import { useState } from 'react'

import { DownloadDocumentButton } from './download-document-button'
import { ErrorDetails } from './error-details'

export interface DialogErrorStateProps {
  readonly report: string
  /** What the IR already knew was doubtful before the printer threw — EXPORT_ENGINE.md § Warnings. */
  readonly warnings: readonly string[]
  /** The escape hatch the prompt names: the document as JSON, which needs no printer to produce. */
  readonly onCopyJson: () => Promise<void>
  readonly onRetry: () => void
}

/**
 * The export dialog's fallback — ARCHITECTURE.md § Error boundaries.
 *
 * A failed export is the one crash where the user's next move is obvious and cheap: the document
 * itself is JSON, and copying that loses only the code generation. So the escape hatch is the
 * primary action here rather than a footnote.
 *
 * The IR warnings are shown because a printer that threw usually did so on something the IR had
 * already flagged, and that list is the closest thing to a cause a user can act on.
 */
export function DialogErrorState({ report, warnings, onCopyJson, onRetry }: DialogErrorStateProps) {
  const [copied, setCopied] = useState(false)

  return (
    <div className="flex flex-col gap-3" data-testid="export-error" role="alert">
      <p className="font-medium text-danger text-sm">
        The export failed while printing. Nothing was written. Copy the document as JSON instead, or
        try again.
      </p>

      {warnings.length === 0 ? null : (
        <div className="flex flex-col gap-1">
          <p className="text-2xs text-foreground-subtle uppercase tracking-[0.14em]">
            What the export had already flagged
          </p>
          <ul className="flex flex-col gap-1" data-testid="export-error-warnings">
            {warnings.map((warning) => (
              <li className="text-foreground-muted text-xs" key={warning}>
                {warning}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={() => {
            void onCopyJson().then(
              () => setCopied(true),
              () => setCopied(false),
            )
          }}
          size="sm"
          variant="primary"
        >
          {copied ? 'Copied' : 'Copy JSON instead'}
        </Button>
        <DownloadDocumentButton />
        <Button onClick={onRetry} size="sm" variant="ghost">
          Try again
        </Button>
      </div>

      <ErrorDetails report={report} />
    </div>
  )
}
