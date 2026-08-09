import { cva } from 'class-variance-authority'

/** The band's own surface. Geometry and rhythm come from the shared `heroSectionStyles`. */
export const heroCenteredSurfaceStyles = cva('overflow-hidden', {
  variants: {
    background: {
      transparent: 'bg-transparent',
      'surface-0': 'bg-surface-0',
      'surface-1': 'bg-surface-1',
      'surface-2': 'bg-surface-2',
    },
  },
})

/**
 * The glow. Wider than it is tall and pushed above centre so it sits behind the headline rather than
 * behind the buttons, blurred past the point where its edge is findable — an edge is what makes a
 * radial gradient read as a circle instead of as light.
 */
export const HERO_CENTERED_GLOW =
  'ms-hero-glow pointer-events-none absolute inset-x-0 top-0 z-0 h-[70%] blur-3xl'
