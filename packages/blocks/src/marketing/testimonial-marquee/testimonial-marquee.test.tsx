import { MARQUEE_CLASS, MARQUEE_CSS, MARQUEE_PAUSABLE_CLASS } from '@motion-studio/motion'
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'
import { requireAt } from '../../test/require-at'

import { TestimonialMarquee } from './testimonial-marquee'
import { testimonialMarqueeDefinition as definition } from './testimonial-marquee.definition'
import { dealRows, rowDirection, rowDuration } from './testimonial-marquee.schema'

describe('marquee arithmetic', () => {
  it('deals items round-robin so reordering one moves one', () => {
    expect(dealRows([1, 2, 3, 4, 5], 2)).toEqual([
      [1, 3, 5],
      [2, 4],
    ])
  })

  it('never leaves a row empty', () => {
    expect(dealRows([1], 3)).toEqual([[1]])
    expect(dealRows([1, 2], 3)).toEqual([[1], [2]])
  })

  it('alternates direction, starting leftward', () => {
    expect(rowDirection(0)).toBe('left')
    expect(rowDirection(1)).toBe('right')
    expect(rowDirection(2)).toBe('left')
  })

  it('slows each row against the one above it', () => {
    expect(rowDuration(20000, 0)).toBe(20000)
    expect(rowDuration(20000, 1)).toBe(23000)
  })
})

describe('TestimonialMarquee', () => {
  it('uses the preset rather than an animation of its own', () => {
    renderBlock(definition, TestimonialMarquee)

    for (const track of screen.getAllByTestId('marquee-track')) {
      expect(track.className).toContain(MARQUEE_CLASS)
    }

    expect(screen.getByTestId('marquee-styles').textContent).toBe(MARQUEE_CSS)
  })

  it('runs one track per row, in alternating directions', () => {
    renderBlock(definition, TestimonialMarquee, { rows: 3 })

    const tracks = screen.getAllByTestId('marquee-track')

    expect(tracks).toHaveLength(3)
    expect(tracks.map((track) => track.dataset['direction'])).toEqual(['left', 'right', 'left'])
  })

  it('carries the preset custom properties the track reads', () => {
    renderBlock(definition, TestimonialMarquee, { rows: 1, duration: 20000 })

    const track = screen.getByTestId('marquee-track')

    expect(track.style.getPropertyValue('--ms-marquee-duration')).toBe('20000ms')
    expect(track.style.getPropertyValue('--ms-marquee-direction')).toBe('-50%')
  })

  it('holds two copies, each at least as wide as the row', () => {
    renderBlock(definition, TestimonialMarquee, { rows: 1 })

    const copies = screen.getByTestId('marquee-track').children

    expect(copies).toHaveLength(2)
    expect(copies[0]?.className).toContain('min-w-full')
    expect(copies[1]?.getAttribute('aria-hidden')).toBe('true')
  })

  it('reads every testimonial once', () => {
    renderBlock(definition, TestimonialMarquee, {
      rows: 1,
      items: [requireAt(definition.defaults.items, 0)],
    })

    expect(screen.getAllByRole('figure', { hidden: false })).toHaveLength(1)
  })

  it('pauses on hover unless told not to', () => {
    const { unmount } = renderBlock(definition, TestimonialMarquee, { rows: 1 })

    expect(screen.getByTestId('marquee-track').className).toContain(MARQUEE_PAUSABLE_CLASS)
    unmount()

    renderBlock(definition, TestimonialMarquee, { rows: 1, pauseOnHover: false })

    expect(screen.getByTestId('marquee-track').className).not.toContain(MARQUEE_PAUSABLE_CLASS)
  })

  it('keeps a track wider than the page inside its own row', () => {
    renderBlock(definition, TestimonialMarquee, { rows: 1 })

    expect(screen.getByTestId('marquee-track').parentElement?.className).toContain(
      'overflow-hidden',
    )
  })

  it('drops the edge mask when the row sits on a coloured band', () => {
    renderBlock(definition, TestimonialMarquee, { rows: 1, fadeEdges: false })

    expect(screen.getByTestId('marquee-track').parentElement?.className).not.toContain(
      'ms-marquee-row',
    )
  })

  it('has no axe violations', async () => {
    const { container } = renderBlock(definition, TestimonialMarquee)

    await expectNoViolations(container)
  })
})
