import type { MotionChannel, MotionSpec, MotionTrigger } from '@motion-studio/schema'

/**
 * What a marketing section does when it arrives, and what a card does under the pointer.
 *
 * A marketing block is never the first thing on the page — the hero is — so the trigger is `inView`
 * rather than `mount`, and `once` because a page that re-animates on scroll-back never settles.
 *
 * Times are milliseconds, the unit `MotionSpec.params` carries all the way to the engines.
 */
const ON_ARRIVAL: MotionTrigger = { kind: 'inView', amount: 0.25, once: true, margin: '0px' }

/**
 * `fade-up` with a child stagger, which is the pair prompt 38 names. 20 px rather than the hero's 28:
 * a section arriving mid-scroll travels less than the band that opens the page, or the stagger reads as
 * a queue rather than as a section settling.
 */
export const marketingEntrance = (
  params: Readonly<Record<string, number | string | boolean>> = {},
): MotionSpec => ({
  presetId: 'fade-up',
  channel: 'entrance',
  trigger: ON_ARRIVAL,
  params: { distance: 20, duration: 520, ...params },
  stagger: { each: 70, from: 'first' },
})

/**
 * The card lift, for the blocks that *are* a card — a node the pointer can be over as a whole.
 * A grid of cards cannot use this: the channel animates the node's wrapper, and the wrapper is the
 * grid, so hovering one cell would raise all of them. Those blocks lift their own cells in CSS.
 */
export const cardHover: MotionSpec = {
  presetId: 'lift',
  channel: 'hover',
  trigger: { kind: 'hover' },
  params: { distance: 4, shadow: 12, duration: 180 },
}

export const marketingMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>> = {
  entrance: marketingEntrance(),
}

export const marketingCardMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>> = {
  entrance: marketingEntrance(),
  hover: cardHover,
}
