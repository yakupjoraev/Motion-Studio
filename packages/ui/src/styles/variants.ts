// Shared class fragments. UI_GUIDELINES.md § Character is the source for what they encode.

/** The one transition a control wears. One per element — see ADR-033. */
export const TRANSITION_CONTROL = 'ms-transition-control'

/** Same, transform on `standard` instead of `accelerate`: a mark travelling, not a press. */
export const TRANSITION_TRAVEL = 'ms-transition-travel'

/** Needs `TRANSITION_CONTROL` alongside it, or the ring does not fade. */
export const FOCUS_RING = 'outline-none focus-visible:shadow-focus'

/** Popovers, menus, dialogs. Glass belongs here and nowhere else in the chrome. */
export const FLOATING_SURFACE =
  'rounded-md border border-border bg-surface-3 shadow-lg backdrop-blur-[--ms-blur-md]'

/** Flat by design: value, not elevation. */
export const PANEL_SURFACE = 'border-border bg-surface-1'

export const ROW = `flex items-center gap-2 px-2 text-xs ${TRANSITION_CONTROL}`

export const DISABLED = 'disabled:pointer-events-none disabled:opacity-50'

/** The curve lives in `TRANSITION_CONTROL`'s transform channel — ADR-033. */
export const PRESS = 'active:scale-[0.98]'
