import type { MotionChannel, MotionSpec } from '@motion-studio/schema'

/**
 * Nothing, for the sidebar's reason: a breadcrumb tells the reader where they are, and a trail that fades
 * in is the one piece of the page they have to wait for to find out. The channel stays available.
 */
export const breadcrumbsMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>> = {}
