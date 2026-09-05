/**
 * The canvas, before there is a canvas — ADR-353.
 *
 * Two surfaces show it: the route's `loading.tsx` while the studio's chunk is in flight, and the
 * canvas island's own `dynamic` fallback once the shell has painted but `CanvasHost` has not. Both
 * wait on the same thing, so both say the same thing rather than one saying nothing.
 *
 * The wording is a state, not a promise: "Opening the studio" is true whether the wait is 200 ms or
 * four seconds, and it names the destination so the press is visibly the one that was made.
 */
export function CanvasPlaceholder() {
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-3 bg-canvas-bg"
      data-testid="canvas-placeholder"
    >
      <div aria-hidden="true" className="h-6 w-6 rounded-full bg-surface-2" data-ms-skeleton />
      {/* An `<output>` rather than a `<p>` with `role="status"`: it is the element that role names. */}
      <output aria-live="polite" className="text-foreground-subtle text-xs">
        Opening the studio…
      </output>
    </div>
  )
}
