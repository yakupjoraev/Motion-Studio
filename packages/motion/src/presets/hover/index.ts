import type { MotionPreset } from '../../model/preset.types'

import { lift } from './lift'
import { liquid } from './liquid'
import { magnetic } from './magnetic'
import { scaleHover } from './scale-hover'
import { borderBeam, glowHover, iconSwap, shine, underlineGrow } from './surface'
import { textScramble } from './text-scramble'
import { tilt3d } from './tilt-3d'

export {
  borderBeam,
  glowHover,
  iconSwap,
  lift,
  liquid,
  magnetic,
  scaleHover,
  shine,
  textScramble,
  tilt3d,
  underlineGrow,
}
export { magneticOffset } from './magnetic'
export { tiltAngles } from './tilt-3d'

/** ANIMATION_SYSTEM.md § Hover, in the order the document lists it. */
export const HOVER_PRESETS: readonly MotionPreset[] = [
  lift,
  scaleHover,
  magnetic,
  tilt3d,
  liquid,
  glowHover,
  borderBeam,
  shine,
  underlineGrow,
  iconSwap,
  textScramble,
]
