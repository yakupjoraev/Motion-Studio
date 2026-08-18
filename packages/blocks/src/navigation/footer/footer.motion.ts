import type { MotionChannel, MotionSpec } from '@motion-studio/schema'

import { footerMotion as sharedFooterMotion } from '../navigation.motion'

/** The one navigation block at the bottom of the page, so it arrives the way a section does. */
export const footerMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>> = sharedFooterMotion
