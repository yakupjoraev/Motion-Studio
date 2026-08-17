import { MARQUEE_CSS } from '@motion-studio/motion'

/**
 * The `marquee` preset's stylesheet, emitted once per block that lays out its own tracks (ADR-186).
 *
 * This is the same thing `CssMotion` does for a node that carries a motion channel — the preset owns the
 * text, and whoever animates emits it beside the element. One copy per block rather than one per row: the
 * declarations are identical, and `buildIR` dedupes by content for the export anyway.
 */
export function MarqueeStyles() {
  return (
    // biome-ignore lint/security/noDangerouslySetInnerHtml: the preset's own keyframes, not user input.
    <style dangerouslySetInnerHTML={{ __html: MARQUEE_CSS }} data-testid="marquee-styles" />
  )
}
