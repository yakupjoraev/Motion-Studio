/**
 * The class fragments the chrome shares. Three of them exist because repeating a focus ring, a panel
 * surface, or a row is how a design system drifts one component at a time.
 *
 * `UI_GUIDELINES.md` § Character sets the rules these encode: chrome is `surface-0`/`surface-1` with
 * hairline borders, **no shadows in the panels** — depth comes from value, not elevation — and exactly one
 * accent colour, used only for selection, focus, active tab and the primary action.
 */

/**
 * The one transition a control wears, from `styles/chrome.css`. It is a plain class rather than Tailwind
 * utilities because an element may have exactly one `transition-property`, and three fragments each adding
 * their own silently collapsed to whichever came last — ADR-033 measured which, and what it broke.
 *
 * Covers colour, border, shadow and the press transform. Anything wearing `PRESS` or `FOCUS_RING` needs it,
 * or those two animate nothing.
 */
export const TRANSITION_CONTROL = 'ms-transition-control'

/** The same, with the transform on `standard` — a mark travelling to a new position, not a press. */
export const TRANSITION_TRAVEL = 'ms-transition-travel'

/**
 * `ACCESSIBILITY.md` § Focus and `UI_GUIDELINES.md` § Focus and keyboard: the two-ring focus shadow,
 * `:focus-visible` only, and never `outline: none` without the replacement in the same fragment.
 *
 * The ring is identical in all four elevation styles (`DESIGN_SYSTEM.md` § The four elevation styles), so a
 * theme change cannot make it disappear. Its 120 ms `standard` fade comes from `TRANSITION_CONTROL`, which
 * every consumer of this fragment also carries.
 */
export const FOCUS_RING = 'outline-none focus-visible:shadow-focus'

/** A floating surface: popovers, menus, dialogs. Glass belongs here and nowhere else in the chrome. */
export const FLOATING_SURFACE =
  'rounded-md border border-border bg-surface-3 shadow-lg backdrop-blur-[--ms-blur-md]'

/** A panel surface. Flat by design: value, not elevation. */
export const PANEL_SURFACE = 'border-border bg-surface-1'

/**
 * A control row. 28 px from `density.ts`, `text-xs` label, hover that reads within one frame —
 * § Interaction feel, hover 120 ms `standard`.
 */
export const ROW = `flex items-center gap-2 px-2 text-xs ${TRANSITION_CONTROL}`

/** Disabled state, applied uniformly so no component invents its own. */
export const DISABLED = 'disabled:pointer-events-none disabled:opacity-50'

/**
 * Press feedback. § Feedback rules: "every press changes something visually within one frame", and § Timing
 * puts press at 80 ms on `accelerate` — the curve lives in `TRANSITION_CONTROL`'s transform channel, since
 * this fragment cannot carry a transition of its own without clobbering the other three (ADR-033).
 */
export const PRESS = 'active:scale-[0.98]'
