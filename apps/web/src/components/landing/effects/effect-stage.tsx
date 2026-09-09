import type { ReactNode } from 'react'

import type { EffectCard } from './effect-cards'

export interface EffectStageProps {
  readonly card: EffectCard
  /** The live effect, when one has mounted. The plate is identical either way, so nothing shifts. */
  readonly children?: ReactNode
  /** The lead cell is twice the width and twice the height of the others on `lg`. */
  readonly lead?: boolean
}

const PLATE = 'ms-stage m-0 flex min-w-0 flex-col border border-border'

/**
 * One plate: the effect at a size worth seeing, its name and the registry's own description under it.
 *
 * **Blueprint in both colour modes.** These are effects made of light, and the band used to show them
 * on vellum, where a beam at the catalogue's own intensity is a smudge — `particles` measured
 * invisible in *both* modes. The plate is the print the light is shown on.
 *
 * **Not six equal tiles.** A row of identical cards is the layout every generated page reaches for,
 * and it also gives every effect the same third of a column whether or not it needs one: the aurora
 * wants area, the border beam wants an edge. The lead cell takes four times the room.
 *
 * `isolate` and `overflow-hidden` because an effect paints into its parent absolutely: the same
 * containment the canvas gives a node.
 */
export function EffectStage({ card, children, lead = false }: EffectStageProps) {
  return (
    <figure className={`${PLATE} ${lead ? 'lg:col-span-2 lg:row-span-2' : ''}`}>
      <div
        className={`relative isolate w-full flex-1 overflow-hidden ${lead ? 'min-h-[18rem] lg:min-h-[34rem]' : 'min-h-[13rem] lg:min-h-[15.5rem]'}`}
        data-testid="effect-stage"
      >
        {children}
      </div>

      <figcaption className="flex flex-col gap-1.5 border-border-subtle border-t px-5 py-4">
        <h3 className="font-mono text-sm uppercase tracking-[0.14em]">{card.name}</h3>
        <p className="max-w-[52ch] text-foreground-muted text-sm leading-snug">
          {card.description}
        </p>
      </figcaption>
    </figure>
  )
}
