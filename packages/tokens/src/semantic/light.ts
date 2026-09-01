import {
  AMBER,
  BLUE,
  CYAN,
  EMERALD,
  NEUTRAL,
  ROSE,
  VIOLET,
  WHITE,
  withAlpha,
} from '../primitives/color'

import type { SemanticColors } from './semantic.types'

/**
 * `DESIGN_SYSTEM.md` § Semantic tokens, light column. Both modes are declared explicitly rather than
 * derived at runtime, and every mapping is a ramp reference — the ramp is the only place a colour
 * value is written.
 *
 * The measured ratio behind each choice is the document's "Why this step" column, and
 * `contrast.test.ts` re-measures all of them on every run.
 */
export const LIGHT: SemanticColors = {
  // Light elevates toward white; `surface-inset` steps the other way, away from that direction.
  'surface-0': NEUTRAL[50],
  'surface-1': WHITE,
  'surface-2': NEUTRAL[100],
  'surface-3': WHITE,
  'surface-inset': NEUTRAL[200],

  foreground: NEUTRAL[950],
  'foreground-muted': NEUTRAL[600],
  // Step 600, the same as `foreground-muted`: no step between them clears 4.5:1 — ADR-323.
  'foreground-subtle': NEUTRAL[600],
  'foreground-onAccent': WHITE,

  // Hairlines. Texture rather than information — § What is deliberately exempt.
  border: NEUTRAL[200],
  'border-strong': NEUTRAL[300],
  'border-subtle': NEUTRAL[100],

  // The ladder descends, away from the pale surfaces of this mode.
  accent: VIOLET[600],
  'accent-hover': VIOLET[700],
  'accent-active': VIOLET[800],
  'accent-muted': VIOLET[100],
  'accent-ring': VIOLET[600],

  // Step 600 is the one clearing 4.5 : 1 both on `surface-1` and on its own muted background.
  success: EMERALD[600],
  'success-muted': EMERALD[100],
  warning: AMBER[600],
  'warning-muted': AMBER[100],
  danger: ROSE[600],
  'danger-muted': ROSE[100],
  info: BLUE[600],
  'info-muted': BLUE[100],

  'canvas-bg': NEUTRAL[100],
  'canvas-grid': NEUTRAL[200],
  'canvas-guide': CYAN[500],
  'canvas-selection': VIOLET[600],
  // The 50 % from UI_GUIDELINES § Canvas is baked in, not applied at call sites.
  'canvas-hover': withAlpha(VIOLET[600], 0.5),
  'canvas-snap': ROSE[500],
}
