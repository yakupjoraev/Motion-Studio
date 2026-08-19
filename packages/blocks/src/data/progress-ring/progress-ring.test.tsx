import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'

import { ProgressRing } from './progress-ring'
import { progressRingDefinition } from './progress-ring.definition'
import { progressRingSchema } from './progress-ring.schema'
import { RING_CIRCUMFERENCE, ringGeometry, ringValueText } from './ring-geometry'

const defaults = progressRingDefinition.defaults

const render = (overrides: Partial<typeof defaults> = {}) =>
  renderBlock(progressRingDefinition, ProgressRing, overrides)

describe('ProgressRing', () => {
  it('validates its own defaults', () => {
    expect(() => progressRingSchema.parse(defaults)).not.toThrow()
  })

  it('has no axe violations at its defaults', async () => {
    const { container } = render()

    await expectNoViolations(container)
  })

  it('carries the whole progressbar quartet on one element', () => {
    render()

    const meter = screen.getByRole('progressbar', { name: defaults.label })

    expect(meter).toHaveAttribute('aria-valuenow', String(defaults.value))
    expect(meter).toHaveAttribute('aria-valuemin', String(defaults.min))
    expect(meter).toHaveAttribute('aria-valuemax', String(defaults.max))
    expect(meter).toHaveAttribute(
      'aria-valuetext',
      ringValueText(ringGeometry(defaults.value, defaults.min, defaults.max).percent),
    )
  })

  it('hides the drawing and the figure, so the value is announced once', () => {
    render()

    expect(screen.getByTestId('ring-svg')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByTestId('ring-readout')).toHaveAttribute('aria-hidden', 'true')
  })

  it('lets the author replace what is announced without touching what is drawn', () => {
    render({ min: 0, max: 62, value: 42, valueText: '42 of 62 blocks migrated', valueUnit: '' })

    const meter = screen.getByRole('progressbar', { name: defaults.label })

    expect(meter).toHaveAttribute('aria-valuetext', '42 of 62 blocks migrated')
    // The figure is the value, not the percentage: 42 of 62 is 68 %, and 68 appears nowhere in the data.
    expect(screen.getByTestId('ring-readout')).toHaveTextContent('42')
  })

  it('writes the arc geometry as custom properties rather than as attributes', () => {
    render()

    const arc = screen.getByTestId('ring-arc')

    expect(arc.style.getPropertyValue('--ms-ring-length')).toBe(String(RING_CIRCUMFERENCE))
    expect(arc.style.getPropertyValue('--ms-ring-offset')).toBe(
      String(ringGeometry(defaults.value, defaults.min, defaults.max).offset),
    )
  })

  it('animates from the class in blocks.css, so reduced motion shows the final value', () => {
    render()

    // The element's own offset is the final state and the keyframe only declares a `from`: with the duration
    // collapsed to zero the ring stays where it is rather than staying empty.
    // `getAttribute`, not `className`: on an SVG element that property is an `SVGAnimatedString`.
    expect(screen.getByTestId('ring-arc').getAttribute('class')).toContain('ms-ring-fill')
  })

  it('drops the figure and the caption when the author asked for neither', () => {
    render({ showValue: false, caption: '' })

    expect(screen.queryByTestId('ring-readout')).toBeNull()
    expect(screen.getByTestId('progress-ring').textContent).toBe('')
  })

  it('adds no tab stop to the page', () => {
    const { container } = render()

    expect(container.querySelectorAll('a, button, input, [tabindex]')).toHaveLength(0)
  })
})

describe('ringGeometry', () => {
  it('leaves nothing undrawn at the top of the range and everything at the bottom', () => {
    expect(ringGeometry(100, 0, 100).offset).toBe(0)
    expect(ringGeometry(0, 0, 100).offset).toBe(RING_CIRCUMFERENCE)
  })

  it('clamps a value outside its own range', () => {
    expect(ringGeometry(140, 0, 100).percent).toBe(100)
    expect(ringGeometry(-40, 0, 100).percent).toBe(0)
  })

  it('reports empty rather than full when the range has no width', () => {
    expect(ringGeometry(50, 10, 10)).toEqual({
      fraction: 0,
      percent: 0,
      offset: RING_CIRCUMFERENCE,
    })
    expect(ringGeometry(50, 80, 10).percent).toBe(0)
  })

  it('answers a range that does not start at zero', () => {
    expect(ringGeometry(50, 25, 75).percent).toBe(50)
  })

  it('rounds, so the same props produce the same bytes on every machine', () => {
    const { offset } = ringGeometry(1, 0, 3)

    expect(offset).toBe(Math.round(offset * 100) / 100)
  })
})

describe('ringValueText', () => {
  it('says what the platform’s own arithmetic cannot', () => {
    expect(ringValueText(68)).toBe('68 percent complete')
  })
})
