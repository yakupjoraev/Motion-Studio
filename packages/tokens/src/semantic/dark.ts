import { AMBER, BLUE, CYAN, EMERALD, NEUTRAL, ROSE, VIOLET, withAlpha } from '../primitives/color'

import type { SemanticColors } from './semantic.types'

/**
 * `DESIGN_SYSTEM.md` § Semantic tokens, dark column. Not an inversion of `LIGHT`: the elevation
 * direction, the accent ladder's direction and the status step all differ, which is what gives the
 * dark palette its own weight.
 */
export const DARK: SemanticColors = {
  // Dark elevates toward lighter grey. `surface-inset` returns to the darkest step, one past
  // `surface-2` away from that direction.
  'surface-0': NEUTRAL[1000],
  'surface-1': NEUTRAL[950],
  'surface-2': NEUTRAL[900],
  'surface-3': NEUTRAL[800],
  'surface-inset': NEUTRAL[1000],

  foreground: NEUTRAL[50],
  'foreground-muted': NEUTRAL[400],
  // The same step as light: `neutral.500` is the one value reading as tertiary in both modes.
  'foreground-subtle': NEUTRAL[500],
  // The far end of the neutral ramp from this mode's accent ladder — ADR-019.
  'foreground-onAccent': NEUTRAL[1000],

  border: NEUTRAL[800],
  'border-strong': NEUTRAL[700],
  'border-subtle': NEUTRAL[900],

  // The ladder ascends, away from the near-black surfaces of this mode.
  accent: VIOLET[400],
  'accent-hover': VIOLET[300],
  'accent-active': VIOLET[200],
  'accent-muted': VIOLET[900],
  'accent-ring': VIOLET[400],

  // Step 400, not 500: at 500 every hue fails on its own muted background (3.87–4.49 : 1).
  success: EMERALD[400],
  'success-muted': EMERALD[900],
  warning: AMBER[400],
  'warning-muted': AMBER[900],
  danger: ROSE[400],
  'danger-muted': ROSE[900],
  info: BLUE[400],
  'info-muted': BLUE[900],

  'canvas-bg': NEUTRAL[1000],
  'canvas-grid': NEUTRAL[900],
  'canvas-guide': CYAN[400],
  'canvas-selection': VIOLET[400],
  'canvas-hover': withAlpha(VIOLET[400], 0.5),
  'canvas-snap': ROSE[400],
}
