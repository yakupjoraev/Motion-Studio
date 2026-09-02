'use client'

import { Button } from '@motion-studio/ui'

import { DownloadDocumentButton } from './download-document-button'
import { ErrorDetails } from './error-details'

export interface SectionErrorChipProps {
  /** The section's own label — `Layout`, `Motion` — so the message says where it broke. */
  readonly section: string
  readonly report: string
  readonly onRetry: () => void
}

/**
 * One inspector section's failure, collapsed to a chip — ARCHITECTURE.md § Error boundaries.
 *
 * Small on purpose: the other sections keep working, so this must not take the panel over. A control
 * that throws costs the user that group of props and nothing else, which is the difference between
 * "the colour picker is broken" and "the inspector is broken".
 */
export function SectionErrorChip({ section, report, onRetry }: SectionErrorChipProps) {
  return (
    <div
      className="flex flex-col gap-1.5 border-border border-b px-3 py-2"
      data-testid="section-error"
      role="alert"
    >
      <p className="text-[11px] text-danger leading-snug">
        {section} controls failed to render. The other sections still work. Try again, or download
        the document.
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        <Button onClick={onRetry} size="sm" variant="secondary">
          Try again
        </Button>
        <DownloadDocumentButton label="Download" />
      </div>
      <ErrorDetails report={report} />
    </div>
  )
}
