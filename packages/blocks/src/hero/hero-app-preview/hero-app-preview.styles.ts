import { cva } from 'class-variance-authority'

/**
 * The tilt. `perspective()` belongs on the transform of the element that rotates, not on a parent's
 * `perspective` property, because the parent here is a grid cell whose width changes at every
 * breakpoint — a shared vanishing point would slide with it. The three values arrive as CSS variables
 * (`.ms-tilt` in `blocks.css`); § Rules 3 allows exactly that for a value the user dials.
 */
export const HERO_PREVIEW_TILT = 'ms-tilt relative z-10 origin-center will-change-transform'

export const HERO_PREVIEW_FRAME =
  'w-full overflow-hidden rounded-xl border border-border bg-surface-1 shadow-2xl'

export const HERO_PREVIEW_IMAGE = 'block h-auto w-full'

/**
 * The glow sits behind the tilted plate, not behind the section: an accent field that ignores the
 * rotation is what makes a tilt look pasted on. Blurred hard and clipped by nothing, so its edge is
 * never findable.
 */
export const HERO_PREVIEW_GLOW =
  'ms-hero-glow pointer-events-none absolute -inset-x-16 -top-8 -bottom-16 z-0 blur-3xl'

/** The window that stands in for a screenshot nobody has uploaded yet. Furniture, so it is hidden. */
export const PLACEHOLDER_BAR =
  'flex items-center gap-2 border-border border-b bg-surface-2 px-4 py-3'

export const PLACEHOLDER_DOT = 'size-2.5 rounded-full bg-border-strong'

export const PLACEHOLDER_BODY = 'flex gap-4 p-4'

export const PLACEHOLDER_SIDEBAR = 'hidden w-1/5 shrink-0 flex-col gap-2 sm:flex'

export const PLACEHOLDER_ROW = 'h-3 rounded-xs bg-surface-2'

/**
 * The stand-in canvas. It carries one node rather than being an empty rectangle: measured against a
 * black surface in dark mode, `surface-inset` and `surface-0` are the same value, so an empty plate
 * read as a hole punched in the page rather than as an editor.
 */
export const PLACEHOLDER_CANVAS =
  'flex aspect-[16/10] flex-1 items-center justify-center rounded-md border border-border-subtle bg-surface-inset'

export const PLACEHOLDER_NODE = 'h-1/2 w-3/5 rounded-md border border-accent/30 bg-accent/15'

export const heroAppPreviewSurfaceStyles = cva('overflow-hidden', {
  variants: {
    background: {
      transparent: 'bg-transparent',
      'surface-0': 'bg-surface-0',
      'surface-1': 'bg-surface-1',
      'surface-2': 'bg-surface-2',
    },
  },
})
