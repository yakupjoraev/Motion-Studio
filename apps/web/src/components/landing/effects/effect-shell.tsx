import type { ReactNode } from 'react'

import type { EffectCard } from './effect-cards'

export interface EffectShellProps {
  readonly card: EffectCard
  /** The live effect, when there is one. The shell is identical either way, so nothing shifts. */
  readonly children?: ReactNode
}

/**
 * One card: a surface, the block's name, the block's own description. The surface is `isolate` and
 * `overflow-hidden` because an effect paints into it absolutely — the same containment the canvas
 * gives a node.
 */
export function EffectShell({ card, children }: EffectShellProps) {
  return (
    <article className="flex flex-col gap-3 rounded-xl border border-border bg-surface-1 p-4 transition-colors hover:border-border-strong">
      <div className="relative isolate h-32 w-full overflow-hidden rounded-lg bg-surface-0">
        {children}
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="font-mono text-2xs uppercase tracking-[0.14em]">{card.name}</h3>
        <p className="text-foreground-muted text-sm leading-snug">{card.description}</p>
      </div>
    </article>
  )
}
