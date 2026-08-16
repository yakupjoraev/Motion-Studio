'use client'

import { commands } from '@motion-studio/editor'
import type { NodeId } from '@motion-studio/schema'
import { useCallback } from 'react'

import { useStudioStore } from '../../../store/editor-store'

import { EffectStackRow } from './effect-stack-row'

/**
 * The stack editor COMPONENT_LIBRARY.md § Effects calls for: add (from the Effects panel), reorder,
 * tune, toggle, remove. Order is paint order, so moving a row is `reorderEffect` and nothing here
 * writes a z-index.
 *
 * Toggling is `opacity: 0` rather than a `disabled` flag, because `EffectInstance` has no such
 * field and adding one would put two ways to switch an effect off in the file format.
 */
export function EffectStackEditor({ nodeId }: { readonly nodeId: NodeId }) {
  const effects = useStudioStore((state) => state.document.nodes[nodeId]?.effects ?? [])

  const move = useCallback(
    (instanceId: string, index: number) => {
      useStudioStore.getState().dispatch(commands.reorderEffect({ nodeId, instanceId, index }))
    },
    [nodeId],
  )

  const remove = useCallback(
    (instanceId: string) => {
      useStudioStore.getState().dispatch(commands.removeEffect({ nodeId, instanceId }))
    },
    [nodeId],
  )

  if (effects.length === 0) {
    return (
      <p className="text-pretty text-2xs text-foreground-subtle" data-testid="effects-summary">
        No effects. Add one from the Effects panel.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2" data-testid="effect-stack">
      {effects.map((instance, index) => (
        <EffectStackRow
          canMoveDown={index < effects.length - 1}
          canMoveUp={index > 0}
          index={index}
          instance={instance}
          key={instance.id}
          nodeId={nodeId}
          onMove={move}
          onRemove={remove}
        />
      ))}
      <p className="text-2xs text-foreground-subtle">
        {effects.length} of {commands.MAX_EFFECTS} layers. Order is paint order.
      </p>
    </div>
  )
}
