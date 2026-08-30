'use client'

import { CopyButton } from './copy-button'
import { SourceView } from './source-view'
import type { SourceState } from './use-source'

export interface SourcePanelProps {
  readonly state: SourceState
}

/**
 * The full listing, below the fold. The copy button is up beside the preview as well as here: the
 * visitor who already knows what they want should not have to scroll past the code to take it, and
 * the visitor who wants to read it first should not have to scroll back up.
 */
export function SourcePanel({ state }: SourcePanelProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl tracking-tight">The code it prints</h2>
        <CopyButton label="Copy React" text={state.source.contents} />
      </div>

      {state.failed ? (
        <p
          aria-live="polite"
          className="rounded-md border border-warning/40 bg-warning-muted/30 px-3 py-2 text-sm"
        >
          The exporter did not load, so this is the source for the block&rsquo;s defaults.
        </p>
      ) : null}

      <SourceView contents={state.source.contents} path={state.source.path} />
    </div>
  )
}
