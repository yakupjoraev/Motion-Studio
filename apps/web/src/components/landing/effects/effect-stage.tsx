import type { ReactNode } from 'react'

import type { EffectCard } from './effect-cards'

export interface EffectStageProps {
  readonly card: EffectCard
  /** The live effect, when one has mounted. The plate is identical either way, so nothing shifts. */
  readonly children?: ReactNode
}

/**
 * The plate the effect is shown on: one artboard, most of the band, blueprint in both colour modes.
 *
 * Six tiles in a track gave every effect a third of a column and a light ground, and the light ground
 * is what killed them — these are effects made of light, and vellum has none to give. The band now
 * shows one at a time, at a size where an aurora reads as an aurora, on the print the light shows on.
 *
 * `isolate` and `overflow-hidden` because an effect paints into its parent absolutely: the same
 * containment the canvas gives a node.
 */
export function EffectStage({ card, children }: EffectStageProps) {
  return (
    <figure className="ms-stage m-0 flex min-w-0 flex-col border border-border">
      {/* The plate is the subject of the band, so it takes the room: a beam crossing 340 px is a
          detail, the same beam crossing 900 is the effect. */}
      <div
        className="relative isolate min-h-[20rem] w-full flex-1 overflow-hidden lg:min-h-[30rem]"
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
