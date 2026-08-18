import type { MotionChannel, MotionSpec } from '@motion-studio/schema'

import { interactiveMotion } from '../interactive.motion'

/**
 * Entrance only. The disclosure itself is not animated, and that is the same decision `faq-accordion` made:
 * a height animation on a panel whose content is arbitrary blocks has to measure that content, and a measured
 * height inside a transform-scaled artboard is the wrong number (the reasoning ADR-203 sets out for the tab
 * indicator). The chevron rotates, which is the part that says what happened.
 */
export const accordionMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>> =
  interactiveMotion
