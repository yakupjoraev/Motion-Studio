import type { MotionPreset } from '../../model/preset.types'

import { horizontalScroll, scrollTimeline } from './gsap-scroll'
import { marquee } from './marquee'
import { parallax, progressBar, scrollFade, scrollRotate, scrollScale } from './progress'
import { stickyStack } from './sticky-stack'

export {
  horizontalScroll,
  marquee,
  parallax,
  progressBar,
  scrollFade,
  scrollRotate,
  scrollScale,
  scrollTimeline,
  stickyStack,
}
export {
  MARQUEE_CLASS,
  MARQUEE_CSS,
  MARQUEE_PAUSABLE_CLASS,
  marqueeCssVars,
  marqueeTrack,
  type MarqueeDirection,
} from './marquee'
export { ON_SCROLL } from './progress'

/** ANIMATION_SYSTEM.md § Scroll, in the order the document lists it. */
export const SCROLL_PRESETS: readonly MotionPreset[] = [
  parallax,
  scrollFade,
  scrollScale,
  scrollRotate,
  stickyStack,
  progressBar,
  horizontalScroll,
  scrollTimeline,
  marquee,
]
