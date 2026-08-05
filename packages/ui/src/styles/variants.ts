/**
 * The class fragments the chrome shares. Three of them exist because repeating a focus ring, a panel
 * surface, or a row is how a design system drifts one component at a time.
 *
 * `UI_GUIDELINES.md` § Character sets the rules these encode: chrome is `surface-0`/`surface-1` with
 * hairline borders, **no shadows in the panels** — depth comes from value, not elevation — and exactly one
 * accent colour, used only for selection, focus, active tab and the primary action.
 */

/**
 * `ACCESSIBILITY.md` § Focus and `UI_GUIDELINES.md` § Focus and keyboard: the two-ring focus shadow,
 * `:focus-visible` only, and never `outline: none` without the replacement in the same fragment.
 *
 * The ring is identical in all four elevation styles (`DESIGN_SYSTEM.md` § The four elevation styles), so a
 * theme change cannot make it disappear.
 */
export const FOCUS_RING =
  'outline-none focus-visible:shadow-focus transition-shadow duration-[--ms-duration-fast] ease-[--ms-ease-standard]'

/** A floating surface: popovers, menus, dialogs. Glass belongs here and nowhere else in the chrome. */
export const FLOATING_SURFACE =
  'rounded-md border border-border bg-surface-3 shadow-lg backdrop-blur-[--ms-blur-md]'

/** A panel surface. Flat by design: value, not elevation. */
export const PANEL_SURFACE = 'border-border bg-surface-1'

/**
 * A control row. 28 px from `density.ts`, `text-xs` label, hover that reads within one frame —
 * § Interaction feel, hover 120 ms `standard`.
 */
export const ROW =
  'flex items-center gap-2 px-2 text-xs transition-colors duration-[--ms-duration-fast] ease-[--ms-ease-standard]'

/** Disabled state, applied uniformly so no component invents its own. */
export const DISABLED = 'disabled:pointer-events-none disabled:opacity-50'

/**
 * Press feedback. § Feedback rules: "every press changes something visually within one frame", and § Timing
 * puts press at 80 ms on `accelerate`.
 */
export const PRESS =
  'active:scale-[0.98] transition-transform duration-[--ms-duration-fast] ease-[--ms-ease-accelerate]'
