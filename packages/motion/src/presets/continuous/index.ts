import type { MotionPreset } from '../../model/preset.types'

import { aurora } from './aurora'
import { beam } from './beam'
import { float } from './float'
import { gradientShift } from './gradient-shift'
import { noiseShift } from './noise-shift'
import { orbit } from './orbit'
import { pulse } from './pulse'
import { typewriter } from './typewriter'

export { aurora, beam, float, gradientShift, noiseShift, orbit, pulse, typewriter }
export { ALWAYS } from './float'

/** ANIMATION_SYSTEM.md § Continuous, in the order the document lists it. */
export const CONTINUOUS_PRESETS: readonly MotionPreset[] = [
  float,
  pulse,
  aurora,
  gradientShift,
  orbit,
  noiseShift,
  beam,
  typewriter,
]
