'use client'

import type { NodeId } from '@motion-studio/schema'

import { useLocale } from '../../../../lib/i18n/locale-context'
import { formatPlural } from '../../../../lib/i18n/plural'
import { useStudio } from '../../../../lib/i18n/studio-surface'
import { useStudioStore } from '../../../../store/editor-store'
import { CustomCssChips } from '../../effects/custom-css-chips'
import { EffectStackEditor } from '../../effects/effect-stack-editor'
import { ControlGroup } from '../control-group'

export interface EffectsSectionProps {
  readonly nodeIds: readonly NodeId[]
}

/**
 * A node-level section: effects live on the node rather than in the block's props, so this one needs
 * no control metadata at all. COMPONENT_LIBRARY.md § Effects calls for a stack editor — add,
 * reorder, tune, toggle, remove — and the catalogue it adds from is the Effects panel.
 */
export function EffectsSection({ nodeIds }: EffectsSectionProps) {
  const { panels } = useStudio()
  const { locale } = useLocale()
  const [nodeId] = nodeIds
  const count = useStudioStore((state) =>
    nodeIds.reduce((total, id) => total + (state.document.nodes[id]?.effects.length ?? 0), 0),
  )

  if (nodeIds.length !== 1 || nodeId === undefined) {
    return (
      <ControlGroup id="effects" label={panels.sectionEffects}>
        <p className="text-pretty text-2xs text-foreground-subtle" data-testid="effects-summary">
          {count === 0
            ? panels.effectsNoneOnSelection
            : formatPlural(locale, count, panels.effectsAcrossSelection)}
        </p>
      </ControlGroup>
    )
  }

  return (
    <ControlGroup id="effects" label={panels.sectionEffects}>
      <EffectStackEditor nodeId={nodeId} />
      {/* A value sent from the playground is a node-level layer too — PLAYGROUND.md § Send to selection. */}
      <CustomCssChips nodeId={nodeId} />
    </ControlGroup>
  )
}
