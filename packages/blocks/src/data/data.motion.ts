import type { MotionChannel, MotionSpec, MotionTrigger } from '@motion-studio/schema'

/**
 * A data block is placed inside a section rather than being one, so it arrives when the section around it
 * does: `inView`, `once`, and a shorter travel than a whole band takes. 12 px is the distance the
 * navigation and interactive categories settle by — a table moving 20 px reads as a section.
 */
const ON_ARRIVAL: MotionTrigger = { kind: 'inView', amount: 0.3, once: true, margin: '0px' }

export const dataEntrance = (
  params: Readonly<Record<string, number | string | boolean>> = {},
): MotionSpec => ({
  presetId: 'fade-up',
  channel: 'entrance',
  trigger: ON_ARRIVAL,
  params: { distance: 12, duration: 420, ...params },
})

export const dataMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>> = {
  entrance: dataEntrance(),
}
