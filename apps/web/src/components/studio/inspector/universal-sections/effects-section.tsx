'use client'

import type { NodeId } from '@motion-studio/schema'

import { useStudioStore } from '../../../../store/editor-store'
import { ControlGroup } from '../control-group'

export interface EffectsSectionProps {
  readonly nodeIds: readonly NodeId[]
}

/**
 * A node-level section: effects live on the node rather than in the block's props, so this one needs
 * no control metadata at all. The stack editor and the catalogue arrive with prompt 33; until then
 * it reports what the node actually carries, which for a document built today is nothing.
 */
export function EffectsSection({ nodeIds }: EffectsSectionProps) {
  const count = useStudioStore((state) =>
    nodeIds.reduce((total, id) => total + (state.document.nodes[id]?.effects.length ?? 0), 0),
  )

  return (
    <ControlGroup id="effects" label="Effects">
      <p className="text-pretty text-2xs text-foreground-subtle" data-testid="effects-summary">
        {count === 0
          ? 'No effects. The picker arrives with the effects panel.'
          : `${count} effect${count === 1 ? '' : 's'} on this selection.`}
      </p>
    </ControlGroup>
  )
}
