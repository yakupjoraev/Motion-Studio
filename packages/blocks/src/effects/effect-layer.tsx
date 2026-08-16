import { type BlockRegistry, type EffectInstance, effectBlockId } from '@motion-studio/schema'
import { type ComponentType, Suspense, useRef } from 'react'

import { renderRegistry } from '../render-registry'

import { useEffectVisibility } from './use-effect-visibility'

/**
 * One instance of the stack. The wrapper owns what `EffectInstance` describes — where it sits
 * relative to the content, how it composites, how strong it is — and the effect component owns what
 * it paints. Keeping the two apart is what lets the stack editor reorder and blend without every
 * effect implementing the same three props.
 *
 * `behind` is `z-index: -1` rather than `0`: an absolutely positioned child paints over static
 * content at `auto`, and the node wrapper's `contain: paint` keeps the negative layer inside the
 * node rather than letting it fall behind the canvas.
 *
 * It also holds still while it is off screen (`data-effect-offscreen`), which is what keeps the
 * compositing layer count following the viewport instead of the document — PERFORMANCE.md
 * § Layer count.
 */
export function EffectLayer({
  instance,
  registry,
}: {
  readonly instance: EffectInstance
  readonly registry: BlockRegistry
}) {
  const ref = useRef<HTMLDivElement>(null)
  const definition = registry.get(effectBlockId(instance.effectId))

  useEffectVisibility(ref, { heavy: definition?.capabilities.costClass === 'heavy' })

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
      ref={ref}
      style={{ mixBlendMode: instance.blendMode, opacity: instance.opacity }}
    >
      <Suspense fallback={null}>
        <Component {...props} />
      </Suspense>
    </div>
  )
}
