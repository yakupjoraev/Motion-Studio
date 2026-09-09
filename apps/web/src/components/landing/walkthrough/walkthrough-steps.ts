import type { CSSProperties } from 'react'

/**
 * The stack the band applies, one row at a time, and then takes off again the same way.
 *
 * Each entry is a real thing in the product — a style prop on the block and four motion presets from
 * `packages/motion` (`flip-in`, `scale-in`, `float`, and the `glow` effect layer) — because a page
 * that invents inspector rows is showing a product that does not exist. What the card does here is
 * the CSS those presets describe, not the presets themselves: the motion engine is 40 kB and this
 * band is on a page with a 120 KiB budget.
 *
 * `value` is a number or a unit and stays out of the dictionary. `key` names the label in it.
 */
export interface WalkthroughStep {
  readonly id: string
  readonly key: 'stepRadius' | 'stepFlip' | 'stepScale' | 'stepFloat' | 'stepGlow'
  readonly value: string
}

export const STEPS: readonly WalkthroughStep[] = [
  { id: 'radius', key: 'stepRadius', value: '24px' },
  { id: 'flip-in', key: 'stepFlip', value: '-14°' },
  { id: 'scale-in', key: 'stepScale', value: '0.88' },
  { id: 'float', key: 'stepFloat', value: '-10px' },
  { id: 'glow', key: 'stepGlow', value: '1.00' },
]

/**
 * What the card looks like with the first `applied` rows on it.
 *
 * The transform is assembled in the stack's own order rather than per row, because a transform is one
 * property: writing `rotateY` on one row and `scale` on the next would have the second replace the
 * first. This is the same reason ADR-349 gives for every scroll keyframe carrying every property it
 * has named so far.
 */
export function walkthroughStyle(applied: number): CSSProperties {
  const has = (index: number): boolean => applied > index
  const transform = [
    has(1) ? 'perspective(900px) rotateY(-14deg)' : '',
    has(2) ? 'scale(0.88)' : '',
    has(3) ? 'translateY(-10px) rotate(-3deg)' : '',
  ]
    .filter((part) => part !== '')
    .join(' ')

  return {
    borderRadius: has(0) ? '24px' : '2px',
    transform: transform === '' ? 'none' : transform,
    boxShadow: has(4) ? '0 0 40px 10px var(--ms-color-accent-muted)' : '0 0 0 0 transparent',
  }
}
