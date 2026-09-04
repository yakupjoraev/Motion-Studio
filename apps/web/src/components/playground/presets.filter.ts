import type { Preset } from './presets'

/**
 * The two filter sandboxes: one paints the element, one paints what is behind it.
 */
export const FILTER_PRESETS: Readonly<Record<'filter' | 'backdrop-filter', readonly Preset[]>> = {
  filter: [
    {
      name: 'Duotone',
      value: 'grayscale(1) sepia(0.4) hue-rotate(200deg) saturate(3)',
      swatch:
        'background: linear-gradient(120deg, oklch(60% 0.16 265), oklch(70% 0.14 200)); filter: grayscale(1) sepia(0.4) hue-rotate(200deg) saturate(3)',
    },
    {
      name: 'Vintage',
      value: 'sepia(0.35) contrast(1.15) saturate(0.85) brightness(1.05)',
      swatch:
        'background: linear-gradient(120deg, oklch(70% 0.14 60), oklch(50% 0.1 30)); filter: sepia(0.35) contrast(1.15)',
    },
    {
      name: 'High contrast',
      value: 'contrast(1.6) saturate(1.2)',
      swatch:
        'background: linear-gradient(120deg, oklch(30% 0 0), oklch(90% 0 0)); filter: contrast(1.6)',
    },
    {
      name: 'Frosted',
      value: 'blur(3px) brightness(1.05) saturate(0.9)',
      swatch:
        'background: linear-gradient(120deg, oklch(70% 0.1 240), oklch(90% 0.05 200)); filter: blur(2px)',
    },
    {
      name: 'Bloom',
      value: 'brightness(1.15) saturate(1.3) blur(0.4px)',
      swatch:
        'background: linear-gradient(120deg, oklch(80% 0.15 90), oklch(70% 0.18 40)); filter: brightness(1.2)',
    },
    {
      name: 'Chromatic edge',
      value: 'drop-shadow(2px 0 0 oklch(62% 0.24 25)) drop-shadow(-2px 0 0 oklch(62% 0.19 250))',
      swatch:
        'background: oklch(96% 0 0); filter: drop-shadow(2px 0 0 oklch(62% 0.24 25)) drop-shadow(-2px 0 0 oklch(62% 0.19 250))',
    },
  ],
  'backdrop-filter': [
    {
      name: 'Subtle glass',
      value: 'blur(6px) saturate(120%)',
      swatch: 'background: oklch(100% 0 0 / 0.12); backdrop-filter: blur(3px)',
    },
    {
      name: 'Frosted glass',
      value: 'blur(16px) saturate(160%) brightness(1.05)',
      swatch: 'background: oklch(100% 0 0 / 0.16); backdrop-filter: blur(6px)',
    },
    {
      name: 'Heavy blur',
      value: 'blur(32px)',
      swatch: 'background: oklch(100% 0 0 / 0.1); backdrop-filter: blur(10px)',
    },
    {
      name: 'Saturated glass',
      value: 'blur(10px) saturate(220%)',
      swatch: 'background: oklch(100% 0 0 / 0.14); backdrop-filter: saturate(220%)',
    },
    {
      name: 'Vibrancy',
      value: 'blur(20px) saturate(180%) contrast(1.1) brightness(1.08)',
      swatch: 'background: oklch(100% 0 0 / 0.18); backdrop-filter: blur(8px) saturate(180%)',
    },
  ],
}
