import type { Preset } from './presets'

/**
 * Shapes, whether they cut with alpha (`mask-image`) or with geometry (`clip-path`).
 */
export const MASK_PRESETS: Readonly<Record<'mask-image' | 'clip-path', readonly Preset[]>> = {
  'mask-image': [
    {
      name: 'Fade bottom',
      value: 'linear-gradient(to bottom, black 40%, transparent 100%)',
      swatch: 'background: linear-gradient(to bottom, oklch(70% 0.14 265), transparent)',
    },
    {
      name: 'Radial vignette',
      value: 'radial-gradient(70% 70% at 50% 50%, black 55%, transparent 100%)',
      swatch:
        'background: radial-gradient(70% 70% at 50% 50%, oklch(70% 0.14 265) 55%, transparent 100%)',
    },
    {
      name: 'Text mask',
      value: 'linear-gradient(90deg, transparent, black 20%, black 80%, transparent)',
      swatch:
        'background: linear-gradient(90deg, transparent, oklch(70% 0.14 265) 20%, oklch(70% 0.14 265) 80%, transparent)',
    },
    {
      name: 'Stripe reveal',
      value: 'repeating-linear-gradient(70deg, black 0 12px, transparent 12px 24px)',
      swatch:
        'background: repeating-linear-gradient(70deg, oklch(70% 0.14 265) 0 4px, transparent 4px 8px)',
    },
    {
      name: 'Feathered edges',
      value:
        'linear-gradient(to right, transparent, black 12%, black 88%, transparent),\n  linear-gradient(to bottom, transparent, black 12%, black 88%, transparent)',
      swatch:
        'background: linear-gradient(to right, transparent, oklch(70% 0.14 265) 20%, oklch(70% 0.14 265) 80%, transparent)',
    },
  ],
  'clip-path': [
    {
      name: 'Hexagon',
      value: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
      swatch:
        'background: oklch(62% 0.19 285); clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
    },
    {
      name: 'Blob',
      value: 'ellipse(46% 38% at 52% 46%)',
      swatch: 'background: oklch(62% 0.19 285); clip-path: ellipse(46% 38% at 52% 46%)',
    },
    {
      name: 'Arrow',
      value: 'polygon(0% 20%, 60% 20%, 60% 0%, 100% 50%, 60% 100%, 60% 80%, 0% 80%)',
      swatch:
        'background: oklch(62% 0.19 285); clip-path: polygon(0% 20%, 60% 20%, 60% 0%, 100% 50%, 60% 100%, 60% 80%, 0% 80%)',
    },
    {
      name: 'Chevron',
      value: 'polygon(0% 0%, 80% 0%, 100% 50%, 80% 100%, 0% 100%, 20% 50%)',
      swatch:
        'background: oklch(62% 0.19 285); clip-path: polygon(0% 0%, 80% 0%, 100% 50%, 80% 100%, 0% 100%, 20% 50%)',
    },
    {
      name: 'Diagonal',
      value: 'polygon(0% 0%, 100% 0%, 100% 78%, 0% 100%)',
      swatch:
        'background: oklch(62% 0.19 285); clip-path: polygon(0% 0%, 100% 0%, 100% 78%, 0% 100%)',
    },
    {
      name: 'Circle',
      value: 'circle(46% at 50% 50%)',
      swatch: 'background: oklch(62% 0.19 285); clip-path: circle(46% at 50% 50%)',
    },
    {
      name: 'Inset rounded',
      value: 'inset(8% 6% 8% 6% round 24px)',
      swatch: 'background: oklch(62% 0.19 285); clip-path: inset(8% 6% 8% 6% round 8px)',
    },
    {
      name: 'Star',
      value:
        'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
      swatch:
        'background: oklch(62% 0.19 285); clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
    },
  ],
}
