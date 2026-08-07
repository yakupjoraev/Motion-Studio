import { GRADIENT } from '@motion-studio/tokens'
import { describe, expect, it } from 'vitest'

import { fromCss, toCss } from './gradient-css'

import type { Gradient } from '@motion-studio/tokens'

const LINEAR: Gradient = {
  kind: 'linear',
  angle: 135,
  stops: [
    { color: 'oklch(58% 0.18 285)', position: 0 },
    { color: 'oklch(72% 0.16 75)', position: 100 },
  ],
}

const RADIAL: Gradient = {
  kind: 'radial',
  shape: 'circle',
  at: { x: 30, y: 70 },
  stops: [
    { color: 'oklch(0% 0 0)', position: 0 },
    { color: 'oklch(100% 0 0)', position: 100 },
  ],
}

const CONIC: Gradient = {
  kind: 'conic',
  from: 220,
  at: { x: 50, y: 50 },
  stops: [
    { color: 'oklch(58% 0.18 285)', position: 0 },
    { color: 'oklch(80% 0.12 200)', position: 35 },
    { color: 'oklch(58% 0.2 25)', position: 100 },
  ],
}

describe('gradient CSS', () => {
  it('writes a linear gradient as CSS reads it', () => {
    expect(toCss(LINEAR)).toBe(
      'linear-gradient(135deg, oklch(58% 0.18 285) 0%, oklch(72% 0.16 75) 100%)',
    )
  })

  it('writes the shape and the centre of a radial gradient', () => {
    expect(toCss(RADIAL)).toContain('radial-gradient(circle at 30% 70%,')
  })

  it('writes the start angle of a conic gradient', () => {
    expect(toCss(CONIC)).toContain('conic-gradient(from 220deg at 50% 50%,')
  })

  it('stacks a mesh gradient into radial layers, one per point', () => {
    const mesh = GRADIENT.aurora.gradient
    const css = toCss(mesh)

    expect(css.split('radial-gradient').length - 1).toBe(mesh.points.length)
  })

  it.each([
    ['linear', LINEAR],
    ['radial', RADIAL],
    ['conic', CONIC],
  ])('round-trips a %s gradient through its own CSS', (_kind, gradient) => {
    expect(fromCss(toCss(gradient))).toEqual(gradient)
  })

  it('round-trips every stop-based preset in the design system', () => {
    for (const preset of Object.values(GRADIENT)) {
      if (preset.gradient.kind !== 'mesh') {
        expect(fromCss(toCss(preset.gradient))).toEqual(preset.gradient)
      }
    }
  })

  it('does not split a colour that contains commas of its own', () => {
    const gradient: Gradient = {
      kind: 'linear',
      angle: 90,
      stops: [
        { color: 'color-mix(in oklab, oklch(58% 0.18 285) 40%, transparent)', position: 0 },
        { color: 'oklch(100% 0 0)', position: 100 },
      ],
    }

    expect(fromCss(toCss(gradient))).toEqual(gradient)
  })

  it('defaults a linear gradient with no angle to the CSS default of 180 degrees', () => {
    expect(fromCss('linear-gradient(oklch(0% 0 0) 0%, oklch(100% 0 0) 100%)')).toMatchObject({
      angle: 180,
    })
  })

  it('tolerates the whitespace a paste brings', () => {
    expect(fromCss('  linear-gradient( 90deg ,  #000 0% ,  #fff 100% )  ')).toMatchObject({
      kind: 'linear',
      angle: 90,
    })
  })

  it.each([
    '',
    'none',
    'url(image.png)',
    'linear-gradient(90deg, oklch(0% 0 0) 0%)',
    'linear-gradient(90deg, oklch(0% 0 0), oklch(100% 0 0))',
    'radial-gradient(oklch(0% 0 0) 0%, oklch(100% 0 0) 100%)',
    'conic-gradient(oklch(0% 0 0) 0%, oklch(100% 0 0) 100%)',
  ])('reports %s rather than guessing at it', (input) => {
    expect(fromCss(input)).toBeNull()
  })

  it('does not read a mesh gradient back, because its blur is not in the string', () => {
    expect(fromCss(toCss(GRADIENT.aurora.gradient))).toBeNull()
  })
})
