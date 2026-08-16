'use client'

import { renderRegistry } from '@motion-studio/blocks'
import type { BlockDefinition } from '@motion-studio/schema'
import { type ComponentType, Suspense, memo } from 'react'

export interface EffectCardProps {
  readonly definition: BlockDefinition
  readonly disabledReason: string | undefined
  readonly onAdd: (definition: BlockDefinition) => void
}

/**
 * One effect in the catalogue, previewing itself live on a small surface rather than through a
 * thumbnail: the effects are cheap enough to run thirteen of them at card size, and a preview that
 * *is* the implementation cannot drift from it.
 *
 * The two heavy ones are lazy in the render registry, so their card suspends into a plain surface
 * until the chunk arrives — which is also what stops browsing the catalogue from fetching them.
 */
export const EffectCard = memo(function EffectCard({
  definition,
  disabledReason,
  onAdd,
}: EffectCardProps) {
  const Component = renderRegistry[definition.id] as
    | ComponentType<Record<string, unknown>>
    | undefined

  return (
    <button
      className="flex w-full flex-col gap-2 rounded-sm border border-border bg-surface-1 p-2 text-left transition-colors hover:border-border-strong disabled:opacity-50"
      data-testid="effect-card"
      disabled={disabledReason !== undefined}
      onClick={() => onAdd(definition)}
      title={disabledReason ?? definition.description}
      type="button"
    >
      <span className="relative isolate block h-12 w-full overflow-hidden rounded-xs bg-surface-0">
        {Component === undefined ? null : (
          <Suspense fallback={null}>
            <Component {...(definition.previewProps as Record<string, unknown>)} />
          </Suspense>
        )}
      </span>
      <span className="truncate text-foreground text-xs">{definition.name}</span>
    </button>
  )
})
