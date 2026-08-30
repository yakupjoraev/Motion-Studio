export { WalkthroughPanel, type WalkthroughValues } from './walkthrough-panel'

/** The two ends of the scrub. The static pair shows exactly these, so the two variants agree. */
export const START = { radius: 2, glow: 0 } as const

export const END = { radius: 24, glow: 1 } as const
