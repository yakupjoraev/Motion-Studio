import type { MotionPreset } from '../../model/preset.types'

import { blurIn } from './blur-in'
import { clipReveal } from './clip-reveal'
import { counter } from './counter'
import { drawLine } from './draw-line'
import { fade } from './fade'
import { fadeDown, fadeLeft, fadeRight, fadeUp } from './fade-directional'
import { flipIn } from './flip-in'
import { scaleIn } from './scale-in'
import { staggerChildren } from './stagger-children'
import { textReveal } from './text-reveal'

export {
  blurIn,
  clipReveal,
  counter,
  drawLine,
  fade,
  fadeDown,
  fadeLeft,
  fadeRight,
  fadeUp,
  flipIn,
  scaleIn,
  staggerChildren,
  textReveal,
}

/** ANIMATION_SYSTEM.md § Entrance, in the order the document lists it. */
export const ENTRANCE_PRESETS: readonly MotionPreset[] = [
  fade,
  fadeUp,
  fadeDown,
  fadeLeft,
  fadeRight,
  scaleIn,
  blurIn,
  clipReveal,
  textReveal,
  flipIn,
  staggerChildren,
  drawLine,
  counter,
]
