'use client'

import { Button } from '@motion-studio/ui'

export interface NodePlaceholderProps {
  readonly blockId: string
  readonly nodeName: string
  readonly onSelect: () => void
  readonly onRestore: () => void
}

/**
 * What stands where a block used to, once the user gives up on it — `prompts/58` § Recovery.
 *
 * The block that throws on every render is the one failure the card cannot fix: reset the props and
 * it throws again, so the boundary catches, renders, and catches again on the next edit anywhere in
 * the document. This stops trying to render it.
 *
 * **The node stays in the document.** Nothing is dispatched, nothing is removed, the props are
 * untouched and an export still contains the block — this is a render the user chose, not an edit.
 * That is what keeps the rest of the document editable without costing them the block's content.
 */
export function NodePlaceholder({ blockId, nodeName, onSelect, onRestore }: NodePlaceholderProps) {
  return (
    <div
      className="flex flex-col items-center gap-2 rounded-sm border border-border border-dashed bg-surface-2/40 p-6 text-center"
      data-testid="node-placeholder"
    >
      <p className="text-foreground-muted text-xs">
        {nodeName} is not being rendered. Its block still holds your content — edit it in the
        inspector, or try it again.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button onClick={onSelect} size="sm" variant="secondary">
          Select
        </Button>
        <Button onClick={onRestore} size="sm" variant="ghost">
          Try the block again
        </Button>
      </div>
      <span className="text-2xs text-foreground-subtle">{blockId}</span>
    </div>
  )
}
