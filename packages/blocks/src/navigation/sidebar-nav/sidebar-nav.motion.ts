import type { MotionChannel, MotionSpec } from '@motion-studio/schema'

/**
 * Nothing. A sidebar is chrome that is already on screen when the page arrives, and a navigation column
 * that fades in is a column the reader waits for. The channel stays available in the inspector — a user
 * who wants one can add it — but the block does not ship an entrance the user has to remove.
 */
export const sidebarNavMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>> = {}
