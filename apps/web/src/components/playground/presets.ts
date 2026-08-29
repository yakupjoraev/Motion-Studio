import type { PlaygroundProperty } from './properties'

/**
 * PLAYGROUND.md § Presets, transcribed. Each one is a starting point rather than a finished answer,
 * which is why they are short enough to read in the editor and edit in place.
 *
 * `swatch` is the CSS the button paints itself with. It is `aria-hidden` in the panel — the name is
 * the accessible one, and a gradient is not a label.
 */
export interface Preset {
  readonly name: string
  readonly value: string
  /** A declaration list for the little square beside the name. Decorative. */
  readonly swatch: string
}

const backgroundSwatch = (value: string): string => `background: ${value}`

export const PRESETS: Readonly<Record<PlaygroundProperty, readonly Preset[]>> = {
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
  transform: [
    {
      name: 'Tilt card',
      value: 'rotateX(14deg) rotateY(-18deg) translateZ(40px)',
      swatch: 'background: oklch(62% 0.19 285); transform: rotate(-8deg)',
    },
    {
      name: 'Isometric',
      value: 'rotateX(54deg) rotateZ(45deg)',
      swatch: 'background: oklch(62% 0.19 285); transform: rotate(45deg) scaleY(0.6)',
    },
    {
      name: 'Flip',
      value: 'rotateY(180deg)',
      swatch: 'background: oklch(62% 0.19 285); transform: scaleX(-1) skewY(6deg)',
    },
    {
      name: 'Perspective stack',
      value: 'perspective(800px) rotateX(28deg) translateY(-8%) scale(0.92)',
      swatch: 'background: oklch(62% 0.19 285); transform: scaleY(0.7) translateY(-2px)',
    },
    {
      name: 'Skew',
      value: 'skew(-12deg, 4deg)',
      swatch: 'background: oklch(62% 0.19 285); transform: skew(-12deg, 4deg)',
    },
  ],
  transition: [
    {
      name: 'Snappy',
      value: 'transform 180ms cubic-bezier(0.2, 0, 0, 1)',
      swatch: 'background: oklch(62% 0.19 285)',
    },
    {
      name: 'Smooth',
      value: 'transform 420ms cubic-bezier(0.4, 0, 0.2, 1)',
      swatch: 'background: oklch(66% 0.16 265)',
    },
    {
      name: 'Springy',
      value: 'transform 700ms linear(0, 0.35 18%, 0.86 38%, 1.06 55%, 0.98 72%, 1)',
      swatch: 'background: oklch(70% 0.14 240)',
    },
    {
      name: 'Bounce',
      value: 'transform 900ms linear(0, 0.6 22%, 1 40%, 0.82 55%, 1 70%, 0.94 82%, 1)',
      swatch: 'background: oklch(72% 0.14 200)',
    },
    {
      name: 'Overshoot',
      value: 'transform 520ms cubic-bezier(0.34, 1.56, 0.64, 1)',
      swatch: 'background: oklch(74% 0.15 160)',
    },
    {
      name: 'Anticipate',
      value: 'transform 620ms cubic-bezier(0.38, -0.4, 0.2, 1.4)',
      swatch: 'background: oklch(76% 0.15 120)',
    },
  ],
}
