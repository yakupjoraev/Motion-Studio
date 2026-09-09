import type { EffectCard } from './effect-cards'

export interface EffectStackProps {
  readonly cards: readonly EffectCard[]
  readonly active: number
  readonly title: string
  /** Absent on the server-rendered fallback, which shows the same list with the first row marked. */
  readonly onPick?: (index: number) => void
}

const ROW =
  'flex w-full items-center gap-3 border-border-subtle py-3 pr-3 pl-4 text-left font-mono text-xs uppercase tracking-[0.14em] outline-none transition-colors duration-[--ms-duration-fast]'

/**
 * The stack, as the studio draws one: the layers on the subject, in order, with the one currently on
 * it marked.
 *
 * The row is a real button, so the band is operable rather than only watchable — and picking a layer
 * stops the cycle, because an animation a reader has taken hold of must not keep moving under them.
 * The active row is marked by the accent rule down its left edge **and** by its weight, never by
 * colour alone.
 */
export function EffectStack({ cards, active, title, onPick }: EffectStackProps) {
  return (
    /* `self-start` so the panel is as tall as the stack: stretched to the plate's height it grew a
       hairline-bordered empty strip under the last row, which reads as a seventh layer. */
    <div className="flex min-w-0 flex-col self-start border border-border bg-surface-1">
      <p className="border-border-subtle border-b px-4 py-2.5 font-mono text-2xs text-foreground-muted uppercase tracking-[0.18em]">
        {title}
      </p>

      <ol className="flex flex-col">
        {cards.map((card, index) => {
          const current = index === active
          const mark = current
            ? 'border-l-2 border-l-accent bg-accent-muted font-medium text-foreground'
            : 'border-l-2 border-l-transparent text-foreground-muted hover:text-foreground'

          return (
            <li className="flex border-border-subtle not-last:border-b" key={card.id}>
              {onPick === undefined ? (
                <span className={`${ROW} ${mark}`}>{card.name}</span>
              ) : (
                <button
                  aria-current={current ? 'true' : undefined}
                  className={`${ROW} ${mark} min-h-11 focus-visible:shadow-focus`}
                  onClick={() => onPick(index)}
                  type="button"
                >
                  {card.name}
                </button>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
