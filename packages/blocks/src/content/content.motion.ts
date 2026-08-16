import type { MotionSpec, MotionTrigger } from '@motion-studio/schema'

/**
 * When a content block arrives: the moment it is a third of the way into the viewport, once. The
 * same trigger the motion panel writes for the channel, so a block's default and a preset the user
 * picks behave identically — a default that arrives differently from a hand-applied preset is a
 * default the user cannot reason about.
 */
const ON_ARRIVAL: MotionTrigger = { kind: 'inView', amount: 0.3, once: true, margin: '0px' }

/**
 * A content block's default entrance. Parameters are the preset's own, in milliseconds and pixels;
 * anything left out comes from the preset's `defaults` when the resolver parses the spec.
 */
export const contentEntrance = (
  presetId: string,
  params: Readonly<Record<string, number | string | boolean>> = {},
): MotionSpec => ({
  presetId,
  channel: 'entrance',
  trigger: ON_ARRIVAL,
  params,
})
