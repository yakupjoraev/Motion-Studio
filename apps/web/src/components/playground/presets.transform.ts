import type { Preset } from './presets'

/**
 * Movement: the transform that places the element, and the transition that gets it there.
 */
export const TRANSFORM_PRESETS: Readonly<Record<'transform' | 'transition', readonly Preset[]>> = {
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
