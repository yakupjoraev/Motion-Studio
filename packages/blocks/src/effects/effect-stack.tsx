import type { BlockRegistry, EffectInstance } from '@motion-studio/schema'

import { blockRegistry as defaultRegistry } from '../registry'

import { EffectLayer } from './effect-layer'

/**
 * Every effect a node carries, in document order. COMPONENT_LIBRARY.md § Effects: a node can hold
 * several, and the order is the stacking order within each layer — which is why the editor's stack
 * editor reorders the array rather than writing a z-index anywhere.
 *
 * Rendered as a sibling of the block's own markup rather than around it, so a block never learns
 * that it has effects and export stays honest.
 */
export function EffectStack({
  effects,
  registry = defaultRegistry,
}: {
  readonly effects: readonly EffectInstance[]
  readonly registry?: BlockRegistry
}) {
  if (effects.length === 0) {
    return null
  }

  return (
    <>
      {effects.map((instance) => (
        <EffectLayer instance={instance} key={instance.id} registry={registry} />
      ))}
    </>
  )
}
