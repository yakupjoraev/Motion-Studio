'use client'

import { InfoIcon, WarningIcon } from '@motion-studio/icons'

import type { ImportNote } from '../../../lib/documents/import-document'

export interface ImportReportProps {
  readonly notes: readonly ImportNote[]
}

/**
 * What was wrong, what was done, and how many nodes it touched — FILE_FORMAT.md § Repair vs reject:
 * "Silent repair is worse than either extreme." The list is the requirement, so it renders even when
 * a repair touched one node and reads as though nothing happened.
 */
export function ImportReport({ notes }: ImportReportProps) {
  if (notes.length === 0) {
    return (
      <p className="text-foreground-muted text-sm">
        Nothing needed repairing. The file opened as it was written.
      </p>
    )
  }

  return (
    <ul className="flex flex-col gap-2" data-testid="import-report">
      {notes.map((note) => (
        <li className="flex items-start gap-2 text-sm" key={`${note.tone}:${note.message}`}>
          <span
            aria-hidden="true"
            className={
              note.tone === 'warning' ? 'mt-0.5 text-warning' : 'mt-0.5 text-foreground-muted'
            }
          >
            {note.tone === 'warning' ? <WarningIcon size={16} /> : <InfoIcon size={16} />}
          </span>
          <span className="min-w-0">
            <span className="sr-only">{note.tone === 'warning' ? 'Repaired: ' : 'Note: '}</span>
            {note.message}
          </span>
        </li>
      ))}
    </ul>
  )
}
