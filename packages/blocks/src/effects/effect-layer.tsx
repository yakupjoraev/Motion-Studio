import { type BlockRegistry, type EffectInstance, effectBlockId } from '@motion-studio/schema'
import { type ComponentType, Suspense } from 'react'

import { renderRegistry } from '../render-registry'

/**
 * One instance of the stack. The wrapper owns what `EffectInstance` describes — where it sits
 * relative to the content, how it composites, how strong it is — and the effect component owns what
 * it paints. Keeping the two apart is what lets the stack editor reorder and blend without every
 * effect implementing the same three props.
 *
 * `behind` is `z-index: -1` rather than `0`: an absolutely positioned child paints over static
 * content at `auto`, and the node wrapper's `contain: paint` keeps the negative layer inside the
 * node rather than letting it fall behind the canvas.
 */
export function EffectLayer({
  instance,
  registry,
}: {
  readonly instance: EffectInstance
  readonly registry: BlockRegistry
}) {
  const definition = registry.get(effectBlockId(instance.effectId))
  const Component = renderRegistry[instance.effectId] as
    | ComponentType<Record<string, unknown>>
    | undefined

  if (definition === undefined || Component === undefined) {
    return null
  }

  // ADR-149: a decorative layer never fails a node. Params that do not parse fall back to the
  // effect's own defaults, which is a visible wrong-looking effect rather than a missing section.
  const parsed = definition.propsSchema.safeParse(instance.params)
  const props = (parsed.success ? parsed.data : definition.defaults) as Record<string, unknown>

  return (
    <div
      className={
        instance.layer === 'behind'
          ? '-z-10 pointer-events-none absolute inset-0'
          : 'pointer-events-none absolute inset-0 z-10'
      }
      data-effect={instance.effectId}
      data-effect-layer={instance.layer}
      data-testid="effect-layer"
      style={{ mixBlendMode: instance.blendMode, opacity: instance.opacity }}
    >
      <Suspense fallback={null}>
        <Component {...props} />
      </Suspense>
    </div>
  )
}
