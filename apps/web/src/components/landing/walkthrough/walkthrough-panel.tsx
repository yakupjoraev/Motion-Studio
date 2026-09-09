import { STEPS, walkthroughStyle } from './walkthrough-steps'

export interface WalkthroughPanelLabels {
  readonly panelTitle: string
  readonly card: string
  readonly stepRadius: string
  readonly stepFlip: string
  readonly stepScale: string
  readonly stepFloat: string
  readonly stepGlow: string
}

export interface WalkthroughRowsProps {
  /** How many of the stack's rows are on the subject right now. */
  readonly applied: number
  /**
   * The panel's strings, handed in rather than read from a hook: this renders inside a Server
   * Component (the static pair) and inside a client one (the cycling variant), and a hook would force
   * the whole panel onto the client for a handful of words.
   */
  readonly labels: WalkthroughPanelLabels
}

const ROW =
  'flex items-center justify-between gap-4 border-border-subtle border-b border-l-2 py-2.5 pr-4 pl-3.5 transition-colors duration-[--ms-duration-fast]'

/**
 * The inspector, as the studio draws it: a panel title and the stack of rows, with the ones currently
 * on the subject marked.
 *
 * A row that is on is marked by the accent rule down its left edge, by its weight and by its value
 * being printed — three signals, because colour alone is not one (ACCESSIBILITY.md § Colour). An
 * inactive row keeps its label at full opacity and shows a dash instead of a number: fading text out
 * would drop it under the contrast floor at every frame but one, which is the mistake ADR-386's
 * sibling records on this page's entrances.
 *
 * Presentational and shared. The cycling variant and the reduced-motion pair both render this, so the
 * two cannot drift into two different pictures of one panel.
 */
export function WalkthroughRows({ applied, labels }: WalkthroughRowsProps) {
  return (
    <div className="overflow-hidden border border-border bg-surface-1">
      <p className="border-border-subtle border-b px-4 py-2.5 font-mono text-foreground-muted text-xs uppercase tracking-[0.14em]">
        {labels.panelTitle}
      </p>

      <ol className="flex flex-col">
        {STEPS.map((step, index) => {
          const on = index < applied

          return (
            <li
              className={`${ROW} ${on ? 'border-l-accent bg-accent-muted' : 'border-l-transparent'}`}
              key={step.id}
            >
              <span className={`text-sm ${on ? 'font-medium' : 'text-foreground-muted'}`}>
                {labels[step.key]}
              </span>
              <span className="font-mono text-sm tabular-nums">{on ? step.value : '—'}</span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export interface WalkthroughSubjectProps {
  readonly applied: number
  readonly labels: WalkthroughPanelLabels
  /** Under the subject: how much of the stack is on it. */
  readonly caption: string
  /**
   * How much of the band this subject occupies. The cycling one fills it; the reduced-motion pair
   * takes half each, so both variants come to the same height and the island's swap moves nothing —
   * ADR-295 measured the alternative at 0.073 CLS.
   */
  readonly half?: boolean
}

/**
 * The thing the stack is applied to, drawn on the sheet.
 *
 * Only `transform`, `border-radius` and `box-shadow` move, and all three are composited. The
 * transition is on the element rather than on a keyframe track because the stack can be taken hold of
 * at any point: a reader who picks a row gets the same 400 ms move to that state as the cycle does.
 */
export function WalkthroughSubject({
  applied,
  labels,
  caption,
  half = false,
}: WalkthroughSubjectProps) {
  return (
    <div
      className={`flex w-full flex-col items-center justify-center gap-5 ${half ? 'min-h-[22vh]' : 'min-h-[44vh]'}`}
    >
      <div
        className="grid max-h-[17rem] w-full max-w-[26rem] flex-1 place-content-center border border-border bg-surface-1 font-mono text-foreground-muted text-xs uppercase tracking-[0.14em] transition-[transform,border-radius,box-shadow] duration-[400ms] ease-[--ms-ease-standard]"
        style={walkthroughStyle(applied)}
      >
        {labels.card}
      </div>

      <p className="font-mono text-foreground-muted text-xs uppercase tracking-[0.14em]">
        {caption}
      </p>
    </div>
  )
}

export interface WalkthroughPairProps {
  readonly labels: WalkthroughPanelLabels
  readonly before: string
  readonly after: string
}

/**
 * The designed alternative for a reader who asked for less motion — `prompts/51` by name: "Not a
 * broken half-state, a designed alternative." Both ends of the stack, side by side, with the panel
 * showing the full set.
 */
export function WalkthroughPair({ labels, before, after }: WalkthroughPairProps) {
  return (
    <>
      <WalkthroughSubject applied={0} caption={before} half labels={labels} />
      <WalkthroughSubject applied={STEPS.length} caption={after} half labels={labels} />
    </>
  )
}
