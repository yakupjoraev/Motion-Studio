import { describe, expect, it } from 'vitest'

import {
  parseParametricShape,
  serializeParametricShape,
  shapeKindOf,
  withParameter,
} from './basic-shape'
import { SHAPE_PRESETS } from './shape-presets'

describe('shapeKindOf', () => {
  it.each([
    ['polygon(0% 0%, 100% 0%, 50% 100%)', 'polygon'],
    ['circle(46% at 50% 50%)', 'circle'],
    ['ellipse(46% 38% at 52% 46%)', 'ellipse'],
    ['inset(8% 6% 8% 6% round 24px)', 'inset'],
    ['path("M 0 0 L 100 0 Z")', 'path'],
    ['var(--shape)', 'other'],
  ])('reads %s as %s', (value, kind) => {
    expect(shapeKindOf(value)).toBe(kind)
  })
})

describe('parametric shapes', () => {
  it.each([
    'circle(46% at 50% 50%)',
    'ellipse(46% 38% at 52% 46%)',
    'inset(8% 6% 8% 6% round 24px)',
  ])('round-trips %s', (value) => {
    const shape = parseParametricShape(value)

    expect(shape).toBeDefined()
    expect(shape === undefined ? '' : serializeParametricShape(shape)).toBe(value)
  })

  it('round-trips every preset that is not a polygon', () => {
    for (const preset of SHAPE_PRESETS) {
      const shape = parseParametricShape(preset.value)

      if (shape !== undefined) {
        expect(serializeParametricShape(shape), preset.name).toBe(preset.value)
      }
    }
  })

  it('spells out the box shorthand so each edge gets its own control', () => {
    const shape = parseParametricShape('inset(10%)')

    expect(shape?.parameters.map((one) => one.value)).toEqual([10, 10, 10, 10])
    expect(shape === undefined ? '' : serializeParametricShape(shape)).toBe(
      'inset(10% 10% 10% 10%)',
    )
  })

  it('takes the two-value shorthand as vertical then horizontal', () => {
    const shape = parseParametricShape('inset(10% 20%)')

    expect(shape?.parameters.map((one) => one.value)).toEqual([10, 20, 10, 20])
  })

  it('gives a circle without an explicit centre the middle of the box', () => {
    const shape = parseParametricShape('circle(40%)')

    expect(shape === undefined ? '' : serializeParametricShape(shape)).toBe(
      'circle(40% at 50% 50%)',
    )
  })

  it('keeps the corner radius in the unit it was written in', () => {
    const shape = parseParametricShape('inset(0% 0% 0% 0% round 24px)')

    expect(shape?.parameters.find((one) => one.id === 'round')?.unit).toBe('px')
  })

  it('changes one parameter and leaves the rest alone', () => {
    const shape = parseParametricShape('ellipse(46% 38% at 52% 46%)')
    const next = shape === undefined ? undefined : withParameter(shape, 'rx', 60)

    expect(next === undefined ? '' : serializeParametricShape(next)).toBe(
      'ellipse(60% 38% at 52% 46%)',
    )
  })

  it('has nothing to offer a polygon or a path', () => {
    expect(parseParametricShape('polygon(0% 0%, 100% 0%, 50% 100%)')).toBeUndefined()
    expect(parseParametricShape('path("M 0 0 L 10 10 Z")')).toBeUndefined()
  })
})
