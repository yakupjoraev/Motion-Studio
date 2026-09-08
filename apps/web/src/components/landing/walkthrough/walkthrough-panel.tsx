export interface WalkthroughValues {
  /** Pixels. The preview's corner radius, and the number the inspector row shows. */
  readonly radius: number
  /** 0 … 1. Drives the glow behind the preview. */
  readonly glow: number
}

export interface WalkthroughPanelLabels {
  readonly panelTitle: string
  readonly radius: string
  readonly glow: string
  readonly card: string
}

export interface WalkthroughRowsProps {
  readonly values: WalkthroughValues
  /**
   * The four strings on the panel, handed in rather than read from a hook: this renders inside a
   * Server Component (the static pair) and inside a client one (the live variant), and a hook would
   * force the whole panel onto the client for four words.
   */
  readonly labels: WalkthroughPanelLabels
}

const ROW = 'flex items-center justify-between gap-4 border-border-subtle border-b px-4 py-2.5'

/**
 * The inspector, as the studio draws it: a panel title and two control rows with their values.
 *
 * Presentational and shared. The static pair, the live scroll-driven version and the reduced-motion
 * variant all render this, so the three cannot drift into three different pictures of one panel.
 */
export function WalkthroughRows({ values, labels }: WalkthroughRowsProps) {
  return (
    <div className="overflow-hidden border border-border bg-surface-1">
      <p className="border-border-subtle border-b px-4 py-2.5 font-mono text-foreground-muted text-xs uppercase tracking-[0.14em]">
        {labels.panelTitle}
      </p>
      <div className={ROW}>
        <span className="text-foreground-muted text-sm">{labels.radius}</span>
        <span className="font-mono text-sm tabular-nums">{values.radius}px</span>
      </div>
      <div className={`${ROW} border-b-0`}>
        <span className="text-foreground-muted text-sm">{labels.glow}</span>
        <span className="font-mono text-sm tabular-nums">{values.glow.toFixed(2)}</span>
      </div>
    </div>
  )
}

export interface WalkthroughSubjectProps {
  readonly values: WalkthroughValues
  readonly labels: WalkthroughPanelLabels
  /** Under the subject: the live readout, or which end of the range this one is. */
  readonly caption: string
  /**
   * How much of the band this subject occupies. One live subject fills it; the reduced-motion pair
   * takes half each, so both variants come to the same height and the island's swap moves nothing —
   * ADR-295 measured the alternative at 0.073 CLS.
   */
  readonly half?: boolean
}

/**
 * The thing the control changes, drawn on the sheet with the value measured under it. The number is a
 * dimension, not a caption: it is the same number the row above shows, printed where the corner it
 * describes actually is.
 */
export function WalkthroughSubject({
  values,
  labels,
  caption,
  half = false,
}: WalkthroughSubjectProps) {
  return (
    <div
      className={`flex w-full flex-col items-center justify-center gap-5 ${half ? 'min-h-[22vh]' : 'min-h-[44vh]'}`}
    >
      <div
        className="grid w-full max-w-[26rem] flex-1 place-content-center border border-border bg-surface-1 max-h-[17rem] font-mono text-foreground-muted text-xs uppercase tracking-[0.14em]"
        style={{
          borderRadius: `${values.radius}px`,
          boxShadow: `0 0 ${40 * values.glow}px ${10 * values.glow}px var(--ms-color-accent-muted)`,
        }}
      >
        {labels.card}
      </div>

      <div aria-hidden="true" className="flex w-full max-w-[26rem] items-center gap-3">
        <span className="ms-dim flex-1" />
        <span className="font-mono text-[10px] text-foreground-muted tabular-nums tracking-[0.18em]">
          {values.radius} PX
        </span>
      </div>

      <p className="font-mono text-foreground-muted text-xs uppercase tracking-[0.14em]">
        {caption}
      </p>
    </div>
  )
}
