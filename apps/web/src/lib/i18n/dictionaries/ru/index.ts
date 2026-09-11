import type { Dictionary } from '../../dictionary'

import { docs } from './docs'
import { errors } from './errors'
import { gallery } from './gallery'
import { landing } from './landing'
import { nav } from './nav'
import { playground } from './playground'
import { studio } from './studio'
import { uiverse } from './uiverse'

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
  playground,
  uiverse,
}
