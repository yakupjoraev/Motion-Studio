import { cva } from 'class-variance-authority'

/**
 * The three fields. Each is larger than the band and anchored off one corner, so what the viewport
 * shows is the *middle* of a gradient rather than a circle sitting on a page — an edge you can find
 * is what makes a radial gradient read as a shape instead of as light.
 */
export const AURORA_FIELD_BASE = 'absolute rounded-full blur-3xl'

export const AURORA_FIELDS = [
  `${AURORA_FIELD_BASE} ms-aurora-field-a -left-[15%] -top-[25%] h-[80%] w-[70%]`,
  `${AURORA_FIELD_BASE} ms-aurora-field-b -right-[20%] -top-[10%] h-[75%] w-[65%]`,
  `${AURORA_FIELD_BASE} ms-aurora-field-c -bottom-[35%] left-[15%] h-[85%] w-[75%]`,
] as const

/** The animation classes, in the same order. Empty when the drift is off — see `blocks.css`. */
export const AURORA_DRIFTS = [
  'ms-aurora-layer ms-aurora-layer-a',
  'ms-aurora-layer ms-aurora-layer-b',
  'ms-aurora-layer ms-aurora-layer-c',
] as const

export const auroraFieldsStyles = cva('absolute inset-0', {
  variants: {
    palette: {
      spectrum: 'ms-aurora-palette-spectrum',
      ember: 'ms-aurora-palette-ember',
      nordic: 'ms-aurora-palette-nordic',
    },
    intensity: {
      subtle: 'opacity-50',
      medium: 'opacity-75',
      vivid: 'opacity-100',
    },
  },
})

/**
 * The scrim. DESIGN_SYSTEM.md § Gradients: a display gradient spans too much of the lightness ladder
 * for any single foreground, so a block that puts text over one adds a scrim first. This one is the
 * surface token rather than black or white, which is what makes the same block correct in both colour
 * modes — the scrim goes light on a light page and dark on a dark one, and `text-foreground` reads
 * against it either way.
 */
export const AURORA_SCRIM =
  'absolute inset-0 bg-gradient-to-b from-surface-0/55 via-surface-0/5 to-surface-0/65'

export const auroraNoiseStyles = cva('absolute inset-0 ms-noise', {
  variants: {
    noise: {
      none: 'hidden',
      subtle: 'opacity-[0.015]',
      light: 'opacity-[0.03]',
      medium: 'opacity-[0.06]',
    },
  },
})
