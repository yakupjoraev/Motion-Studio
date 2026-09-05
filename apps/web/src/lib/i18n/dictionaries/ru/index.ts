import type { Dictionary } from '../../dictionary'

import { docs } from './docs'
import { errors } from './errors'
import { gallery } from './gallery'
import { landing } from './landing'
import { nav } from './nav'
import { studio } from './studio'

/**
 * Russian. Typed as `Dictionary`, so the compiler — not a reviewer, and not a missing-string report
 * from production — is what says a key was left untranslated (ADR-360).
 */
export const ru: Dictionary = {
  nav,
  errors,
  landing,
  gallery,
  docs,
  studio,
}
