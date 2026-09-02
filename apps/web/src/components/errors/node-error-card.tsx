'use client'

import { Button } from '@motion-studio/ui'

import { DownloadDocumentButton } from './download-document-button'
import { ErrorDetails } from './error-details'

export interface NodeErrorCardProps {
  readonly blockId: string
  readonly nodeName: string
  readonly report: string
  /** What the block said, for the one clause of the message that is specific to this failure. */
  readonly message: string
  /** Undoable — `prompts/58` § Recovery: a fix offered here must be reversible like any edit. */
  readonly onResetProps: () => void
  readonly onSelect: () => void
  readonly onDelete: () => void
}

/**
 * One node's failure, inline where the node was — ARCHITECTURE.md § Error boundaries.
 *
 * The rest of the canvas keeps rendering, which is what makes this survivable: a document with one
 * broken block is still a document being edited, not a lost session.
 *
 * The copy follows the what/where/what-to-do rule: the block that failed, the reason it gave, and
 * three things the user can actually do about it. The stack goes under `Details`.
 */
export function NodeErrorCard({
  blockId,
  nodeName,
  report,
  message,
  onResetProps,
  onSelect,
  onDelete,
}: NodeErrorCardProps) {
  return (
    <div
      className="flex flex-col gap-2 rounded-sm border border-danger/40 bg-danger-muted/30 p-3 text-xs"
      data-testid="node-error"
      role="alert"
    >
      <p className="font-medium text-danger">
        {nodeName} failed to render. {message} Reset its props or delete the block.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={onResetProps} size="sm" variant="secondary">
          Reset to defaults
        </Button>
        <Button onClick={onSelect} size="sm" variant="ghost">
          Select
        </Button>
        <Button onClick={onDelete} size="sm" variant="ghost">
          Delete block
        </Button>
        <DownloadDocumentButton />
      </div>

      <span className="text-2xs text-foreground-subtle">{blockId}</span>
      <ErrorDetails report={report} />
    </div>
  )
}
