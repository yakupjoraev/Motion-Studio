import type { MotionChannel, MotionSpec } from '@motion-studio/schema'

import { marketingMotion } from '../marketing.motion'

/**
 * The shared entrance. No hover channel: the cards are inside one node, so the channel would raise the
 * whole row at once. The cards do not lift at all — a card holding the page's only price should not move
 * under the pointer on the way to its button.
 */
export const pricingTableMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>> =
  marketingMotion
