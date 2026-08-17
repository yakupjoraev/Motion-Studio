'use client'

import { blockRegistry } from '@motion-studio/blocks/registry'
import { commands } from '@motion-studio/editor'
import { type BlockDefinition, type NodeId, nodeId } from '@motion-studio/schema'
import { useToast } from '@motion-studio/ui'
import { createId } from '@motion-studio/utils'
import { useCallback } from 'react'

import { useStudioStore } from '../../../../store/editor-store'
import { revealNode } from '../../canvas-area/canvas-handle'

export type InsertOutcome = { readonly inserted: NodeId } | { readonly rejected: string }

/**
 * Where a block lands is `resolveInsertTarget`'s answer and nobody else's — prompt 16 built it for
 * exactly this caller, and paste resolves through the same function. A second copy of the walk here
 * would be a second set of rules for "the isolated container, else beside the selection, else the
 * root", and the two would drift on the first change to either.
 *
 * ADR-061: the id is chosen by the caller, because the caller is the one that has to select the
 * result and the command does not report what it created.
 */
export function insertBlockAtSelection(definition: BlockDefinition): InsertOutcome {
  const state = useStudioStore.getState()
  const target = commands.resolveInsertTarget({
    document: state.document,
    selectionIds: state.selection.ids,
    isolationId: state.selection.isolationId,
    blockId: definition.id,
    registry: blockRegistry,
  })

  if ('rejected' in target) {
    return { rejected: target.rejected }
  }

  const id = nodeId(createId('node'))

  state.dispatch(
    commands.insertBlock({
      blockId: definition.id,
      parentId: target.parentId,
      slot: target.slot,
      index: target.index,
      id,
    }),
  )
  state.select([id], 'replace')

  return { inserted: id }
}

/**
 * The keyboard path of ACCESSIBILITY.md § Block palette, plus the two things prompt 37 asks of a
 * successful insert: the new node is selected and it is in view. A rejection says why in a toast
 * rather than doing nothing — a card that responds to `Enter` with silence reads as broken.
 */
export function useInsertBlock(): (definition: BlockDefinition) => void {
  const toast = useToast()

  return useCallback(
    (definition: BlockDefinition) => {
      const outcome = insertBlockAtSelection(definition)

      if ('rejected' in outcome) {
        toast({
          title: `Cannot add ${definition.name}`,
          description: outcome.rejected,
          tone: 'danger',
        })

        return
      }

      revealNode(outcome.inserted)
    },
    [toast],
  )
}
