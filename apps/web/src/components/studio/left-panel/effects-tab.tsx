'use client'

import { blockRegistry } from '@motion-studio/blocks'
import { commands } from '@motion-studio/editor'
import { type BlockDefinition, effectId } from '@motion-studio/schema'
import { EmptyState, ScrollArea } from '@motion-studio/ui'
import { useCallback } from 'react'

import { useStudioStore } from '../../../store/editor-store'

import { EffectCard } from './effect-card'

/**
 * PRODUCT.md § 2, Effects: the catalogue of layers that attach to a node rather than replacing it.
 * Adding one is `addEffect`, so it undoes, and the cap the command enforces is shown here rather
 * than discovered by a user whose ninth click did nothing.
 */
export function EffectsTab() {
  const effects = blockRegistry.byCategory('effects')
  const targetId = useStudioStore((state) => state.selection.ids[0] ?? null)
  const stackSize = useStudioStore((state) =>
    targetId === null ? 0 : (state.document.nodes[targetId]?.effects.length ?? 0),
  )

  const onAdd = useCallback(
    (definition: BlockDefinition) => {
      if (targetId === null) {
        return
      }

      useStudioStore
        .getState()
        .dispatch(commands.addEffect({ nodeId: targetId, effectId: effectId(definition.id) }))
    },
    [targetId],
  )

  if (effects.length === 0) {
    return <EmptyState className="h-full" message="No effects are registered." />
  }

  const full = stackSize >= commands.MAX_EFFECTS

  const reason =
    targetId === null
      ? 'Select a block first'
      : full
        ? `This block already carries ${commands.MAX_EFFECTS} effects`
        : undefined

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-2 p-2" data-testid="effects-tab">
        <p className="px-1 text-2xs text-foreground-subtle">
          {targetId === null
            ? 'Select a block to attach an effect to it.'
            : `${stackSize} of ${commands.MAX_EFFECTS} layers used on this block.`}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {effects.map((definition) => (
            <EffectCard
              definition={definition}
              disabledReason={reason}
              key={definition.id}
              onAdd={onAdd}
            />
          ))}
        </div>
      </div>
    </ScrollArea>
  )
}
