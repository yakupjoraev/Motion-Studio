import type { MotionChannel, MotionSpec, MotionTrigger } from '@motion-studio/schema'

/**
 * An interactive block is placed inside a section rather than being one, so it arrives when the section
 * around it does: `inView`, `once`, and a shorter travel than a whole band takes. 12 px is the same
 * distance the navigation category settles by — a control moving 20 px reads as a section.
 */
const ON_ARRIVAL: MotionTrigger = { kind: 'inView', amount: 0.3, once: true, margin: '0px' }

export const interactiveEntrance = (
  params: Readonly<Record<string, number | string | boolean>> = {},
): MotionSpec => ({
  presetId: 'fade-up',
  channel: 'entrance',
  trigger: ON_ARRIVAL,
  params: { distance: 12, duration: 420, ...params },
})

export const interactiveMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>> = {
  entrance: interactiveEntrance(),
}

/**
 * The button's hover default, and the reason it is here rather than in a prop: ADR-204. All five presets
 * prompt 40 names — `lift`, `scale-hover`, `magnetic`, `shine`, `glow-hover` — are registered on the
 * `hover` channel, so declaring the channel in `capabilities.supportsMotion` is what makes them
 * selectable, and it is what lets a user remove the one below. A prop could have done neither.
 *
 * `lift` is the default because it is the quietest of the five and the only one that reads correctly on a
 * `ghost` button, which has no plate for a glow or a shine to happen on.
 */
export const controlHover: MotionSpec = {
  presetId: 'lift',
  channel: 'hover',
  trigger: { kind: 'hover' },
  params: { distance: 2, shadow: 10, duration: 160 },
}

export const controlMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>> = {
  entrance: interactiveEntrance(),
  hover: controlHover,
}
