import type { CSSProperties } from 'react'

/**
 * The stack the band applies, one row at a time, and then takes off again the same way.
 *
 * Each entry is a real thing in the product — style props on the block, motion presets from
 * `packages/motion` (`flip-in`, `scale-in`, `float`, `orbit`, `pulse`, `lift`) and the `glow` effect
 * layer — because a page that invents inspector rows is showing a product that does not exist. What
 * the card does here is the CSS those presets describe, not the presets themselves: the motion engine
 * is 40 kB and this band is on a page with a 120 KiB budget.
 *
 * `value` is a number or a unit and stays out of the dictionary. `key` names the label in it.
 */
export interface WalkthroughStep {
  readonly id: string
  readonly key:
    | 'stepRadius'
    | 'stepBorder'
    | 'stepFlip'
    | 'stepScale'
    | 'stepFloat'
    | 'stepOrbit'
    | 'stepLift'
    | 'stepGlow'
  readonly value: string
}

export const STEPS: readonly WalkthroughStep[] = [
  { id: 'radius', key: 'stepRadius', value: '24px' },
  { id: 'border', key: 'stepBorder', value: '2px' },
  { id: 'flip-in', key: 'stepFlip', value: '-16°' },
  { id: 'scale-in', key: 'stepScale', value: '0.86' },
  { id: 'float', key: 'stepFloat', value: '-12px' },
  { id: 'orbit', key: 'stepOrbit', value: '-6°' },
  { id: 'lift', key: 'stepLift', value: '18px' },
  { id: 'glow', key: 'stepGlow', value: '1.00' },
]

/**
 * What the card looks like with the first `applied` rows on it.
 *
 * The transform is assembled in the stack's own order rather than per row, because a transform is one
 * property: writing `rotateY` on one row and `scale` on the next would have the second replace the
 * first. This is the same reason ADR-349 gives for every scroll keyframe carrying every property it
 * has named so far.
 *
 * Every row moves something a reader can name: the corner, the edge, the face turning, the size, the
 * rise, the tilt, the shadow lifting it off the sheet, the light around it.
 */
export function walkthroughStyle(applied: number): CSSProperties {
  const has = (index: number): boolean => applied > index
  const transform = [
    has(2) ? 'perspective(900px) rotateY(-16deg)' : '',
    has(3) ? 'scale(0.86)' : '',
    has(4) ? 'translateY(-12px)' : '',
    has(5) ? 'rotate(-6deg)' : '',
  ]
    .filter((part) => part !== '')
    .join(' ')

  const shadows = [
    has(6) ? '0 18px 34px -18px var(--ms-color-accent-muted)' : '',
    has(7) ? '0 0 44px 12px var(--ms-color-accent-muted)' : '',
  ].filter((part) => part !== '')

  return {
    borderRadius: has(0) ? '24px' : '2px',
    borderWidth: has(1) ? '2px' : '1px',
    borderColor: has(1) ? 'var(--ms-color-accent)' : 'var(--ms-color-border)',
    transform: transform === '' ? 'none' : transform,
    boxShadow: shadows.length === 0 ? '0 0 0 0 transparent' : shadows.join(', '),
  }
}
