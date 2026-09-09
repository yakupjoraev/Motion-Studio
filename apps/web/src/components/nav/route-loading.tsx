const BAR = 'bg-surface-2'

export interface RouteLoadingProps {
  /** The coordinate the surface's own header prints, so the frame that waits is the frame that lands. */
  readonly rail: string
  /** How many rows of content to reserve under the heading. */
  readonly rows?: number
}

/**
 * What a public route shows between the press and the page — ADR-353 for `/studio`, and this is the
 * same argument for the other three.
 *
 * A press with no answer reads as a press that missed, and until this existed only `/studio` had one:
 * `/playground`, `/blocks` and `/docs` left the previous page on screen for as long as their payload
 * took. The owner reported it as "I click Playground and nothing happens at all".
 *
 * It is the surface's own shape rather than a spinner — a rail label, a heading block, a rule, then
 * rows — so nothing jumps when the real page replaces it. The pulse is `data-ms-skeleton`, whose
 * duration is a token multiplied by `--ms-reduced-motion`, so it stops for a reader who asked it to.
 */
export function RouteLoading({ rail, rows = 3 }: RouteLoadingProps) {
  return (
    <div aria-busy="true" className="ms-landing" data-testid="route-loading">
      <div className="mx-auto w-full max-w-[76rem] px-5 pt-9 sm:px-8">
        <div className="relative">
          <span
            aria-hidden="true"
            className="absolute -top-4 left-0 h-4 w-px bg-[var(--ms-l-line-strong)]"
          />
          <span
            aria-hidden="true"
            className="absolute -top-px right-0 left-0 h-px bg-[var(--ms-l-line-strong)]"
          />
          <p className="absolute -top-7 left-2 font-mono text-[10px] text-[var(--ms-l-ink-soft)] uppercase tracking-[0.2em]">
            {rail}
          </p>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[76rem] flex-col gap-10 px-5 py-14 sm:px-8">
        <div className="flex flex-col gap-4">
          <div className={`${BAR} h-10 w-full max-w-[28rem]`} data-ms-skeleton />
          <div className={`${BAR} h-4 w-full max-w-[38rem]`} data-ms-skeleton />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: rows * 3 }, (_, index) => index).map((row) => (
            <div className={`${BAR} h-[7.5rem] w-full`} data-ms-skeleton key={row} />
          ))}
        </div>
      </div>
    </div>
  )
}
