import type { ReactNode } from 'react'

import type { EffectCard } from './effect-cards'

export interface EffectShellProps {
  readonly card: EffectCard
  /** The live effect, when there is one. The shell is identical either way, so nothing shifts. */
  readonly children?: ReactNode
  /**
   * The one tile that carries the section. Six identical cards in three columns is the page telling
   * the reader that all six matter equally, which is not true and reads as a template; one tile at
   * two columns by two rows is the same six cards with a subject.
   *
   * It only applies from `lg`. Below that the grid is two columns and six cards fill it exactly, and
   * a span would leave a half-empty row instead of a rhythm.
   */
  readonly featured?: boolean
}

/**
 * One card: a surface, the block's name, the block's own description. The surface is `isolate` and
 * `overflow-hidden` because an effect paints into it absolutely — the same containment the canvas
 * gives a node.
 */
export function EffectShell({ card, children, featured = false }: EffectShellProps) {
  return (
    <article
      className={`flex flex-col gap-3 rounded-xl border border-border bg-surface-1 p-4 transition-colors hover:border-border-strong ${featured ? 'lg:col-span-2 lg:row-span-2' : ''}`}
    >
      <div
        className={`relative isolate w-full overflow-hidden rounded-lg bg-surface-0 ${featured ? 'h-32 lg:h-full lg:min-h-[17rem]' : 'h-32'}`}
      >
        {children}
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="font-mono text-sm uppercase tracking-[0.12em]">{card.name}</h3>
        <p className="text-foreground-muted text-sm leading-snug">{card.description}</p>
      </div>
    </article>
  )
}
