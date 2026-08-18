import type { MotionChannel, MotionSpec } from '@motion-studio/schema'

/**
 * A navigation bar is the first thing on the page, so it arrives on `mount` rather than in view — an
 * `inView` trigger on an element already in the viewport is a fade the reader never sees begin.
 * 12 px rather than the marketing section's 20: chrome settles, it does not travel.
 */
export const navEntrance = (
  params: Readonly<Record<string, number | string | boolean>> = {},
): MotionSpec => ({
  presetId: 'fade-down',
  channel: 'entrance',
  trigger: { kind: 'mount' },
  params: { distance: 12, duration: 420, ...params },
})

export const navMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>> = {
  entrance: navEntrance(),
}

/** The one navigation block that is at the *bottom* of the page, and so arrives the way a section does. */
export const footerMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>> = {
  entrance: {
    presetId: 'fade-up',
    channel: 'entrance',
    trigger: { kind: 'inView', amount: 0.15, once: true, margin: '0px' },
    params: { distance: 16, duration: 480 },
  },
}
