export interface WalkthroughValues {
  /** Pixels. The preview's corner radius, and the number the inspector row shows. */
  readonly radius: number
  /** 0 … 1. Drives the glow behind the preview. */
  readonly glow: number
}

export interface WalkthroughPanelProps {
  readonly values: WalkthroughValues
  /** Rendered under the preview: the caption for a static pair, or the live readout. */
  readonly caption: string
  /**
   * Half the preview height. The static pair renders two panels where the live variant renders one,
   * and two full-height panels made the section 258 px taller — a hole the moment the island swapped
   * (ADR-295). Compact is what makes the two variants the same height.
   */
  readonly compact?: boolean
}

const ROW = 'flex items-center justify-between gap-4 border-border-subtle border-b px-4 py-2.5'

/**
 * An inspector row and the thing it changes, side by side. Presentational and shared: the static
 * pair, the live scroll-driven version and the reduced-motion variant all render this, so the three
 * cannot drift into three different pictures of the same panel.
 */
export function WalkthroughPanel({ values, caption, compact = false }: WalkthroughPanelProps) {
  return (
    <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
      <div className="bg-surface-1">
        <p className="px-4 py-2.5 font-mono text-2xs text-foreground-muted uppercase tracking-[0.14em]">
          Inspector · Style
        </p>
        <div className={ROW}>
          <span className="text-foreground-muted text-sm">Radius</span>
          <span className="font-mono text-sm tabular-nums">{values.radius}px</span>
        </div>
        <div className={`${ROW} border-b-0`}>
          <span className="text-foreground-muted text-sm">Glow</span>
          <span className="font-mono text-sm tabular-nums">{values.glow.toFixed(2)}</span>
        </div>
      </div>

      <div
        className={`flex flex-col items-center justify-center gap-3 bg-surface-1 ${compact ? 'p-4' : 'p-8'}`}
      >
        <div
          className={`grid w-full max-w-[18rem] place-content-center border border-border bg-surface-2 font-mono text-2xs text-foreground-muted uppercase tracking-[0.14em] ${compact ? 'h-16' : 'h-28'}`}
          style={{
            borderRadius: `${values.radius}px`,
            boxShadow: `0 0 ${24 * values.glow}px ${6 * values.glow}px var(--ms-color-accent-muted)`,
          }}
        >
          Card
        </div>
        <p className="font-mono text-2xs text-foreground-muted uppercase tracking-[0.14em]">
          {caption}
        </p>
      </div>
    </div>
  )
}
