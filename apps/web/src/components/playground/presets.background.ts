import type { Preset } from './presets'

const backgroundSwatch = (value: string): string => `background: ${value}`

/**
 * Gradients and meshes: the property whose presets are pictures, so the swatch is the value itself.
 */
export const BACKGROUND_PRESETS: Readonly<Record<'background', readonly Preset[]>> = {
  background: [
    {
      name: 'Aurora',
      value:
        'radial-gradient(60% 60% at 30% 20%, oklch(62% 0.19 285), transparent 70%),\n  radial-gradient(50% 50% at 75% 60%, oklch(70% 0.15 210), transparent 70%),\n  oklch(20% 0.01 265)',
      swatch: backgroundSwatch(
        'radial-gradient(60% 60% at 30% 20%, oklch(62% 0.19 285), transparent 70%), oklch(20% 0.01 265)',
      ),
    },
    {
      name: 'Sunset',
      value:
        'linear-gradient(160deg, oklch(72% 0.17 45), oklch(60% 0.21 15) 55%, oklch(38% 0.16 320))',
      swatch: backgroundSwatch(
        'linear-gradient(160deg, oklch(72% 0.17 45), oklch(60% 0.21 15) 55%, oklch(38% 0.16 320))',
      ),
    },
    {
      name: 'Ocean',
      value: 'linear-gradient(180deg, oklch(58% 0.12 235), oklch(32% 0.09 250))',
      swatch: backgroundSwatch('linear-gradient(180deg, oklch(58% 0.12 235), oklch(32% 0.09 250))'),
    },
    {
      name: 'Ember',
      value:
        'radial-gradient(80% 120% at 50% 120%, oklch(70% 0.19 55), transparent 60%),\n  oklch(18% 0.02 40)',
      swatch: backgroundSwatch(
        'radial-gradient(80% 120% at 50% 120%, oklch(70% 0.19 55), transparent 60%), oklch(18% 0.02 40)',
      ),
    },
    {
      name: 'Mint',
      value: 'linear-gradient(140deg, oklch(88% 0.09 165), oklch(66% 0.13 175))',
      swatch: backgroundSwatch('linear-gradient(140deg, oklch(88% 0.09 165), oklch(66% 0.13 175))'),
    },
    {
      name: 'Mesh 4-point',
      value:
        'radial-gradient(45% 45% at 15% 20%, oklch(70% 0.18 300), transparent 70%),\n  radial-gradient(45% 45% at 85% 20%, oklch(72% 0.16 200), transparent 70%),\n  radial-gradient(45% 45% at 20% 85%, oklch(74% 0.15 150), transparent 70%),\n  radial-gradient(45% 45% at 85% 80%, oklch(68% 0.19 25), transparent 70%),\n  oklch(22% 0.01 265)',
      swatch: backgroundSwatch(
        'radial-gradient(45% 45% at 15% 20%, oklch(70% 0.18 300), transparent 70%), radial-gradient(45% 45% at 85% 80%, oklch(68% 0.19 25), transparent 70%), oklch(22% 0.01 265)',
      ),
    },
    {
      name: 'Conic ring',
      value:
        'conic-gradient(from 210deg, oklch(62% 0.19 285), oklch(72% 0.16 200), oklch(74% 0.15 150), oklch(62% 0.19 285))',
      swatch: backgroundSwatch(
        'conic-gradient(from 210deg, oklch(62% 0.19 285), oklch(72% 0.16 200), oklch(74% 0.15 150), oklch(62% 0.19 285))',
      ),
    },
    {
      name: 'Noise gradient',
      value:
        'repeating-linear-gradient(45deg, oklch(100% 0 0 / 0.05) 0 2px, transparent 2px 4px),\n  linear-gradient(160deg, oklch(40% 0.12 275), oklch(22% 0.04 265))',
      swatch: backgroundSwatch(
        'repeating-linear-gradient(45deg, oklch(100% 0 0 / 0.12) 0 2px, transparent 2px 4px), linear-gradient(160deg, oklch(40% 0.12 275), oklch(22% 0.04 265))',
      ),
    },
    {
      name: 'Grid lines',
      value:
        'linear-gradient(oklch(100% 0 0 / 0.08) 1px, transparent 1px) 0 0 / 24px 24px,\n  linear-gradient(90deg, oklch(100% 0 0 / 0.08) 1px, transparent 1px) 0 0 / 24px 24px,\n  oklch(20% 0.01 265)',
      swatch: backgroundSwatch(
        'linear-gradient(oklch(100% 0 0 / 0.2) 1px, transparent 1px) 0 0 / 8px 8px, linear-gradient(90deg, oklch(100% 0 0 / 0.2) 1px, transparent 1px) 0 0 / 8px 8px, oklch(20% 0.01 265)',
      ),
    },
    {
      name: 'Dot grid',
      value:
        'radial-gradient(oklch(100% 0 0 / 0.16) 1px, transparent 1px) 0 0 / 18px 18px,\n  oklch(18% 0.01 265)',
      swatch: backgroundSwatch(
        'radial-gradient(oklch(100% 0 0 / 0.35) 1px, transparent 1px) 0 0 / 6px 6px, oklch(18% 0.01 265)',
      ),
    },
    {
      name: 'Radial spotlight',
      value:
        'radial-gradient(60% 60% at 50% 0%, oklch(88% 0.06 265 / 0.5), transparent 70%),\n  oklch(16% 0.01 265)',
      swatch: backgroundSwatch(
        'radial-gradient(60% 60% at 50% 0%, oklch(88% 0.06 265 / 0.5), transparent 70%), oklch(16% 0.01 265)',
      ),
    },
  ],
}
