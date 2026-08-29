/**
 * Real values across the eight properties the playground sandboxes — PLAYGROUND.md § Property
 * sandboxes. They are the floor the validator is held to: a layer that rejects one of these is wrong,
 * whatever it caught.
 *
 * Written the way a person writes them, spacing and casing included, because the normalizer's job is
 * to make those spellings agree and it cannot be tested on values that already agree.
 */
export interface ValidCss {
  readonly property: string
  readonly value: string
}

export const VALID_CSS: readonly ValidCss[] = [
  { property: 'background', value: 'red' },
  { property: 'background', value: '#101014' },
  { property: 'background', value: '#FFF' },
  { property: 'background', value: 'rgb(12 12 16 / 60%)' },
  { property: 'background', value: 'rgba(0,0,0,.4)' },
  { property: 'background', value: 'hsl(240 8% 12%)' },
  { property: 'background', value: 'oklch(62% 0.19 285)' },
  { property: 'background', value: 'oklab(59% 0.1 -0.14)' },
  { property: 'background', value: 'color-mix(in oklab, oklch(62% 0.19 285), white 20%)' },
  { property: 'background', value: 'color(display-p3 0.4 0.2 0.9)' },
  { property: 'background', value: 'light-dark(#fff, #101014)' },
  { property: 'background', value: 'linear-gradient(180deg, #101014 0%, #1a1a22 100%)' },
  { property: 'background', value: 'linear-gradient(to right, transparent, currentColor)' },
  {
    property: 'background',
    value: 'radial-gradient(60% 60% at 30% 20%, oklch(62% 0.19 285), transparent 70%)',
  },
  { property: 'background', value: 'conic-gradient(from 45deg, #101014, #1a1a22, #101014)' },
  {
    property: 'background',
    value: 'repeating-linear-gradient(45deg, #101014 0 8px, #1a1a22 8px 16px)',
  },
  { property: 'background', value: 'var(--ms-color-surface-2)' },
  { property: 'background', value: 'var(--ms-color-surface-2, #101014)' },
  { property: 'background', value: 'url("data:image/png;base64,iVBORw0KGgo=") center / cover' },
  {
    property: 'background',
    value:
      'radial-gradient(50% 50% at 75% 60%, oklch(70% 0.15 210), transparent 70%), oklch(20% 0.01 265)',
  },
  { property: 'box-shadow', value: 'none' },
  { property: 'box-shadow', value: '0 1px 2px rgba(0,0,0,.4)' },
  {
    property: 'box-shadow',
    value: '0 1px 2px oklch(0% 0 0 / 0.16), 0 8px 24px oklch(0% 0 0 / 0.18)',
  },
  { property: 'box-shadow', value: 'inset 0 0 0 1px rgb(255 255 255 / 6%)' },
  { property: 'box-shadow', value: '0 0 0 3px color-mix(in oklab, currentColor, transparent 70%)' },
  { property: 'box-shadow', value: '0 24px 48px -12px rgb(0 0 0 / 0.5)' },
  { property: 'filter', value: 'none' },
  { property: 'filter', value: 'blur(4px)' },
  { property: 'filter', value: 'saturate(1.4) contrast(1.1)' },
  { property: 'filter', value: 'drop-shadow(0 8px 16px rgb(0 0 0 / 0.35))' },
  { property: 'filter', value: 'grayscale(1) brightness(1.2) hue-rotate(45deg)' },
  { property: 'filter', value: 'opacity(0.6) invert(100%)' },
  { property: 'backdrop-filter', value: 'blur(12px) saturate(160%)' },
  { property: 'backdrop-filter', value: 'blur(2rem)' },
  { property: 'backdrop-filter', value: 'brightness(0.8) blur(8px)' },
  { property: 'mask-image', value: 'linear-gradient(to bottom, black 40%, transparent 100%)' },
  {
    property: 'mask-image',
    value: 'radial-gradient(circle at 50% 50%, black 60%, transparent 100%)',
  },
  { property: 'mask-image', value: 'url("data:image/png;base64,iVBORw0KGgo=")' },
  {
    property: 'mask-image',
    value: 'linear-gradient(black, transparent), linear-gradient(to right, transparent, black)',
  },
  { property: 'clip-path', value: 'none' },
  { property: 'clip-path', value: 'circle(40% at 50% 50%)' },
  { property: 'clip-path', value: 'ellipse(40% 30% at 50% 50%)' },
  { property: 'clip-path', value: 'inset(10% 20% 30% 40% round 12px)' },
  { property: 'clip-path', value: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' },
  { property: 'clip-path', value: 'polygon(0 0, 100% 0, 100% 80%, 0 100%)' },
  { property: 'transform', value: 'none' },
  { property: 'transform', value: 'translateY(-2px)' },
  { property: 'transform', value: 'translate3d(0, -2px, 0) scale(1.02)' },
  { property: 'transform', value: 'rotateX(14deg) rotateY(-18deg) translateZ(40px)' },
  { property: 'transform', value: 'matrix(1, 0, 0, 1, 0, -2)' },
  { property: 'transform', value: 'perspective(800px) rotate3d(1, 1, 0, 20deg)' },
  { property: 'transform', value: 'scale(1.5) skew(4deg, 2deg)' },
  { property: 'transition', value: 'none' },
  { property: 'transition', value: 'opacity 200ms ease-out' },
  { property: 'transition', value: 'transform 600ms cubic-bezier(0.16, 1, 0.3, 1)' },
  { property: 'transition', value: 'transform 400ms linear(0, 0.5 40%, 1)' },
  { property: 'transition', value: 'opacity 150ms ease, transform 300ms ease-in-out 50ms' },
  { property: 'transition', value: 'all 0.2s steps(4, end)' },
  { property: 'letter-spacing', value: '-0.01em' },
  { property: 'grid-template-columns', value: '[full-start] minmax(1rem, 1fr) [content] 60ch' },
  { property: 'font-family', value: '"Helvetica Neue", Inter, system-ui, sans-serif' },
  { property: 'content', value: '"\\201C"' },
  { property: 'width', value: 'clamp(20cqw, 50%, 40rem)' },
]
