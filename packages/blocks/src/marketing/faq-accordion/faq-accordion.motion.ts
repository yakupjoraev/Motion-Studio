import type { MotionChannel, MotionSpec } from '@motion-studio/schema'

import { marketingMotion } from '../marketing.motion'

/**
 * The shared entrance on the section. The panels' own open and close animation belongs to Radix and to
 * `blocks.css` if it ever gets one — a motion channel on this node would animate the whole list, which is
 * not what a panel opening looks like.
 */
export const faqAccordionMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>> =
  marketingMotion
