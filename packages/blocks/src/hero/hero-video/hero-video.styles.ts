import { cva } from 'class-variance-authority'

/**
 * The scrim is a gradient in the surface token, not a flat black wash. Two reasons, and neither is
 * taste: a gradient keeps the footage readable where the text is not, and a surface token makes the
 * same block correct in both colour modes — the scrim goes light on a light page and dark on a dark
 * one, so `text-foreground` reads against it either way.
 *
 * `strong` is the default because the block validates nothing about the footage it is given. A scrim
 * tuned to one clip is a scrim that fails on the next one.
 */
export const heroVideoScrimStyles = cva('absolute inset-0', {
  variants: {
    scrim: {
      soft: 'bg-gradient-to-t from-surface-0/80 via-surface-0/35 to-surface-0/20',
      medium: 'bg-gradient-to-t from-surface-0/90 via-surface-0/60 to-surface-0/40',
      strong: 'bg-gradient-to-t from-surface-0/95 via-surface-0/80 to-surface-0/65',
    },
  },
})

export const HERO_VIDEO_ELEMENT = 'absolute inset-0 h-full w-full object-cover'

/** With no footage the block is still a hero, so it falls back to the same accent field the centred one uses. */
export const HERO_VIDEO_FALLBACK = 'ms-hero-glow absolute inset-0 blur-3xl'
