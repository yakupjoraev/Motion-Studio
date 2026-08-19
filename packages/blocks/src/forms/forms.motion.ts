import type { MotionChannel, MotionSpec, MotionTrigger } from '@motion-studio/schema'

/**
 * A form is placed inside a section rather than being one, so it arrives when the section around it does:
 * `inView`, `once`, and a shorter travel than a whole band takes.
 *
 * Nothing else in the category animates. A field that moved when it became invalid would move the fields under
 * it at the moment the reader is trying to read the message, and an error is the one state on a page that must
 * not be something the reader has to wait for.
 */
const ON_ARRIVAL: MotionTrigger = { kind: 'inView', amount: 0.3, once: true, margin: '0px' }

export const formsEntrance = (
  params: Readonly<Record<string, number | string | boolean>> = {},
): MotionSpec => ({
  presetId: 'fade-up',
  channel: 'entrance',
  trigger: ON_ARRIVAL,
  params: { distance: 12, duration: 420, ...params },
})

export const formsMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>> = {
  entrance: formsEntrance(),
}
