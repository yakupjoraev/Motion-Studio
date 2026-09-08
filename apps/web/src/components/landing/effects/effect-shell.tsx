import type { ReactNode } from 'react'

import type { EffectCard } from './effect-cards'

export interface EffectShellProps {
  readonly card: EffectCard
  /** The live effect, when there is one. The shell is identical either way, so nothing shifts. */
  readonly children?: ReactNode
  /** The card's place in the track, printed on it the way a drawing numbers its details. */
  readonly index: number
  readonly total: number
}

/**
 * One panel in the rail: the effect at the size it is worth seeing, then its name and the registry's
 * own description under it.
 *
 * A card in a three-column grid gave each effect 128 px of height, which is enough to say an effect
 * exists and not enough to show one. On the rail it gets most of a viewport, which is why the rail
 * exists — DESIGN_REFERENCES.md § Applying it per surface puts this category at maximum loudness.
 *
 * The surface is `isolate` and `overflow-hidden` because an effect paints into it absolutely: the same
 * containment the canvas gives a node.
 */
export function EffectShell({ card, children, index, total }: EffectShellProps) {
  return (
    <article className="ms-hpin-card flex flex-col gap-4 border border-border bg-surface-1 p-4 transition-colors hover:border-border-strong">
      <div className="relative isolate h-[46vh] max-h-[26rem] min-h-[14rem] w-full overflow-hidden bg-surface-0">
        {children}
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-mono text-sm uppercase tracking-[0.14em]">{card.name}</h3>
          <span
            aria-hidden="true"
            className="font-mono text-[10px] text-foreground-muted tabular-nums tracking-[0.18em]"
          >
            {String(index + 1).padStart(2, '0')}/{String(total).padStart(2, '0')}
          </span>
        </div>
        <p className="text-foreground-muted text-sm leading-snug">{card.description}</p>
      </div>
    </article>
  )
}
