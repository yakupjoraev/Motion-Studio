import { z } from 'zod'

/**
 * RESPONSIVE_ENGINE.md § Breakpoints — Tailwind's scale, so an exported class is a direct translation
 * rather than a re-derivation. `base` is the unconditional value; every other entry applies at its
 * `min` width and above.
 */
export const BREAKPOINTS = {
  base: { id: 'base', label: 'Base', min: 0, frame: 375, prefix: '' },
  sm: { id: 'sm', label: 'Small', min: 640, frame: 640, prefix: 'sm:' },
  md: { id: 'md', label: 'Medium', min: 768, frame: 768, prefix: 'md:' },
  lg: { id: 'lg', label: 'Large', min: 1024, frame: 1024, prefix: 'lg:' },
  xl: { id: 'xl', label: 'XL', min: 1280, frame: 1280, prefix: 'xl:' },
  '2xl': { id: '2xl', label: '2XL', min: 1536, frame: 1536, prefix: '2xl:' },
} as const

export type BreakpointId = keyof typeof BREAKPOINTS

export interface Breakpoint {
  readonly id: BreakpointId
  readonly label: string
  readonly min: number
  readonly frame: number
  readonly prefix: string
}

/** Ascending by `min`, which is what makes the resolution a fold rather than a lookup. */
export const CASCADE_ORDER = ['base', 'sm', 'md', 'lg', 'xl', '2xl'] as const

export const breakpointIdSchema = z.enum(CASCADE_ORDER)

export const isBreakpointId = (value: string): value is BreakpointId => value in BREAKPOINTS
