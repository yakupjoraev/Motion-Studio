'use client'

import { commands } from '@motion-studio/editor'
import type { NodeId } from '@motion-studio/schema'
import type { ReactNode } from 'react'

import { useStudioStore } from '../../../store/editor-store'
import { ErrorBoundary } from '../../errors/error-boundary'
import { NodeErrorCard } from '../../errors/node-error-card'

export interface NodeErrorBoundaryProps {
  readonly blockId: string
  readonly nodeId: NodeId
  readonly nodeName: string
  /** The block's schema defaults, which is what "reset to defaults" resets to. */
  readonly defaults: Record<string, unknown>
  readonly children: ReactNode
}

const messageOf = (error: unknown): string =>
  error instanceof Error && error.message !== '' ? `${error.message}.` : 'It threw while rendering.'

/**
 * One boundary per node. A block that throws takes out its own card and nothing else — the rest of
 * the canvas keeps rendering and the document is still in the store, which is what makes the failure
 * survivable rather than a lost session.
 *
 * What the card offers is the point of the boundary rather than a decoration on it: the two things
 * that fix a node in practice are resetting the props that broke it and deleting the block, and both
 * are ordinary commands, so both are undoable.
 */
export function NodeErrorBoundary({
  blockId,
  nodeId,
  nodeName,
  defaults,
  children,
}: NodeErrorBoundaryProps) {
  /**
   * Every prop back to its default in **one** history entry: a reset the user cannot undo in one
   * press is a second thing to recover from — `prompts/58` § Recovery.
   */
  const resetProps = (): void => {
    const batch = Object.entries(defaults).map(([path, value]) =>
      commands.setProp({ nodeId, path, value }),
    )

    useStudioStore.getState().dispatchBatch(batch, `Reset ${nodeName}`)
  }

  return (
    <ErrorBoundary
      blockId={blockId}
      describeDocument={() => useStudioStore.getState().document ?? null}
      fallback={({ error, report, reset }) => (
        <NodeErrorCard
          blockId={blockId}
          message={messageOf(error)}
          nodeName={nodeName}
          onDelete={() => {
            useStudioStore.getState().dispatch(commands.removeNodes({ ids: [nodeId] }))
          }}
          onResetProps={() => {
            resetProps()
            // Cleared after the command, so the node re-renders against the props it just got.
            reset()
          }}
          onSelect={() => useStudioStore.getState().select([nodeId])}
          report={report}
        />
      )}
      nodeId={nodeId}
      where={`node:${blockId}`}
    >
      {children}
    </ErrorBoundary>
  )
}
