import type { Preset } from './presets'

/**
 * Elevation, as a layer list. `Alt+click` appends rather than replaces, which is why every entry is one complete shadow.
 */
export const SHADOW_PRESETS: Readonly<Record<'box-shadow', readonly Preset[]>> = {
  'box-shadow': [
    {
      name: 'Soft lift',
      value: '0 1px 2px oklch(0% 0 0 / 0.14),\n  0 8px 24px oklch(0% 0 0 / 0.16)',
      swatch: 'background: oklch(96% 0 0); box-shadow: 0 2px 6px oklch(0% 0 0 / 0.35)',
    },
    {
      name: 'Sharp editorial',
      value: '4px 4px 0 oklch(20% 0.02 265)',
      swatch: 'background: oklch(96% 0 0); box-shadow: 3px 3px 0 oklch(20% 0.02 265)',
    },
    {
      name: 'Layered depth',
      value:
        '0 1px 1px oklch(0% 0 0 / 0.1),\n  0 2px 4px oklch(0% 0 0 / 0.1),\n  0 8px 16px oklch(0% 0 0 / 0.1),\n  0 24px 48px oklch(0% 0 0 / 0.12)',
      swatch:
        'background: oklch(96% 0 0); box-shadow: 0 1px 2px oklch(0% 0 0 / 0.3), 0 6px 10px oklch(0% 0 0 / 0.3)',
    },
    {
      name: 'Inner well',
      value: 'inset 0 2px 6px oklch(0% 0 0 / 0.35)',
      swatch: 'background: oklch(90% 0 0); box-shadow: inset 0 2px 5px oklch(0% 0 0 / 0.45)',
    },
    {
      name: 'Neon glow',
      value: '0 0 0 1px oklch(62% 0.19 285),\n  0 0 24px oklch(62% 0.19 285 / 0.6)',
      swatch: 'background: oklch(30% 0.05 285); box-shadow: 0 0 10px oklch(62% 0.19 285)',
    },
    {
      name: 'Long shadow',
      value:
        '8px 8px 0 oklch(62% 0.19 285 / 0.28),\n  16px 16px 0 oklch(62% 0.19 285 / 0.18),\n  24px 24px 0 oklch(62% 0.19 285 / 0.1)',
      swatch: 'background: oklch(96% 0 0); box-shadow: 4px 4px 0 oklch(62% 0.19 285 / 0.5)',
    },
    {
      name: 'Neumorphic',
      value: '8px 8px 16px oklch(0% 0 0 / 0.2),\n  -8px -8px 16px oklch(100% 0 0 / 0.06)',
      swatch:
        'background: oklch(70% 0.01 265); box-shadow: 3px 3px 6px oklch(0% 0 0 / 0.3), -3px -3px 6px oklch(100% 0 0 / 0.35)',
    },
  ],
}
