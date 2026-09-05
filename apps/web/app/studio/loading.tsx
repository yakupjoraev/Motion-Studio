import { CanvasPlaceholder } from '../../src/components/studio/canvas-placeholder'

const PANEL = 'ms-panel-overlay bg-surface-1'

const BAR = 'rounded-xs bg-surface-2'

/**
 * What the studio shows between the press and the shell — ADR-353.
 *
 * `/studio` is a route segment whose chunk is the biggest in the app, and until this file existed the
 * navigation had no fallback at all: the landing page stayed on screen, unchanged and with nothing
 * spinning, for as long as the chunk took. A press with no answer reads as a press that missed.
 *
 * It is the shell's own grid rather than a spinner, so the frame the user is waiting for is the frame
 * that arrives — the panels do not jump into place afterwards. The pulse is `data-ms-skeleton`, whose
 * duration is a token multiplied by `--ms-reduced-motion`, so it stops for a reader who asked it to.
 */
export default function Loading() {
  return (
    // The announcement is `CanvasPlaceholder`'s own `<output>`; this frame only reports that it is busy.
    <div aria-busy="true" className="ms-studio" data-testid="studio-loading">
      {/* `col-span-3` on both bars, as `TopBar` and `StatusBar` carry: the grid has three columns and
          auto-placement would otherwise put the bar in the first one and shift every panel along. */}
      <header className="col-span-3 flex items-center gap-3 border-border border-b bg-surface-1 px-3">
        <div className={`${BAR} h-4 w-[96px]`} data-ms-skeleton />
        <div className={`${BAR} h-4 w-[64px]`} data-ms-skeleton />
        <div className="flex-1" />
        <div className={`${BAR} h-6 w-[120px]`} data-ms-skeleton />
      </header>

      <aside
        aria-hidden="true"
        className={`${PANEL} flex flex-col gap-2 border-border border-r p-3`}
        data-open="false"
        data-side="left"
      >
        <div className={`${BAR} h-7 w-full`} data-ms-skeleton />
        {[0, 1, 2, 3, 4, 5].map((row) => (
          <div className={`${BAR} h-[72px] w-full`} data-ms-skeleton key={row} />
        ))}
      </aside>

      <main className="overflow-hidden">
        <CanvasPlaceholder />
      </main>

      <aside
        aria-hidden="true"
        className={`${PANEL} flex flex-col gap-2 border-border border-l p-3`}
        data-open="false"
        data-side="right"
      >
        <div className={`${BAR} h-4 w-[80px]`} data-ms-skeleton />
        {[0, 1, 2, 3, 4].map((row) => (
          <div className={`${BAR} h-7 w-full`} data-ms-skeleton key={row} />
        ))}
      </aside>

      <footer className="col-span-3 flex items-center border-border border-t bg-surface-1 px-3">
        <div className={`${BAR} h-3 w-[140px]`} data-ms-skeleton />
      </footer>
    </div>
  )
}
