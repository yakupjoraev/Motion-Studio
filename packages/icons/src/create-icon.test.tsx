import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { CursorIcon } from './cursor'
import { ICON_NAMES } from './icon-name'
import { ICON_REGISTRY } from './registry'
import { SearchIcon } from './search'

const svgOf = (element: HTMLElement): SVGSVGElement => {
  const svg = element.querySelector('svg')
  if (svg === null) {
    throw new Error('no svg rendered')
  }

  return svg
}

describe('the icon contract', () => {
  it('renders on the documented 20 × 20 grid', () => {
    const svg = svgOf(render(<CursorIcon />).container)

    expect(svg.getAttribute('viewBox')).toBe('0 0 20 20')
  })

  it('defaults to 16 px in both dimensions', () => {
    const svg = svgOf(render(<CursorIcon />).container)

    expect(svg.getAttribute('width')).toBe('16')
    expect(svg.getAttribute('height')).toBe('16')
  })

  it('lets size set both dimensions', () => {
    const svg = svgOf(render(<CursorIcon size={24} />).container)

    expect(svg.getAttribute('width')).toBe('24')
    expect(svg.getAttribute('height')).toBe('24')
  })

  it('strokes 1.5 px in currentColor with round caps and joins, and no fill', () => {
    const svg = svgOf(render(<CursorIcon />).container)

    expect(svg.getAttribute('stroke')).toBe('currentColor')
    expect(svg.getAttribute('stroke-width')).toBe('1.5')
    expect(svg.getAttribute('stroke-linecap')).toBe('round')
    expect(svg.getAttribute('stroke-linejoin')).toBe('round')
    expect(svg.getAttribute('fill')).toBe('none')
  })

  it('lets strokeWidth be raised for an icon rendered large', () => {
    const svg = svgOf(render(<CursorIcon strokeWidth={2} />).container)

    expect(svg.getAttribute('stroke-width')).toBe('2')
  })

  it('passes a className through', () => {
    const svg = svgOf(render(<CursorIcon className="text-accent-ring" />).container)

    expect(svg.getAttribute('class')).toBe('text-accent-ring')
  })

  it('does not let a caller break the geometry contract', () => {
    // The grid and the stroke are applied after the caller's props on purpose: an icon that could be
    // turned into a 24 × 18 filled shape by a stray prop is not a contract.
    const svg = svgOf(render(<CursorIcon fill="red" viewBox="0 0 24 24" />).container)

    expect(svg.getAttribute('fill')).toBe('none')
    expect(svg.getAttribute('viewBox')).toBe('0 0 20 20')
  })

  it('carries a displayName, so a component tree is readable', () => {
    expect(CursorIcon.displayName).toBe('CursorIcon')
  })
})

describe('accessibility defaults', () => {
  it('hides an icon from assistive technology by default', () => {
    // An icon is decorative; its container carries the accessible name.
    const svg = svgOf(render(<CursorIcon />).container)

    expect(svg.getAttribute('aria-hidden')).toBe('true')
    expect(svg.getAttribute('focusable')).toBe('false')
    expect(svg.getAttribute('role')).toBeNull()
  })

  it('promotes a labelled icon to an image and drops aria-hidden', () => {
    const svg = svgOf(render(<SearchIcon aria-label="Search blocks" />).container)

    expect(svg.getAttribute('aria-hidden')).toBeNull()
    expect(svg.getAttribute('role')).toBe('img')
    expect(svg.getAttribute('aria-label')).toBe('Search blocks')
  })

  it('treats aria-labelledby the same way', () => {
    const svg = svgOf(render(<SearchIcon aria-labelledby="heading" />).container)

    expect(svg.getAttribute('aria-hidden')).toBeNull()
    expect(svg.getAttribute('role')).toBe('img')
  })

  it.each(ICON_NAMES)('hides %s by default', (name) => {
    const Icon = ICON_REGISTRY[name]

    expect(svgOf(render(<Icon />).container).getAttribute('aria-hidden')).toBe('true')
  })
})

describe('the glyphs', () => {
  it.each(ICON_NAMES)('keeps %s inside the grid', (name) => {
    const Icon = ICON_REGISTRY[name]
    const svg = svgOf(render(<Icon />).container)
    const coordinates = [...svg.querySelectorAll('path, circle, rect')].flatMap((node) => {
      const attributes = ['d', 'cx', 'cy', 'r', 'x', 'y', 'width', 'height']

      return (
        attributes
          .map((attribute) => node.getAttribute(attribute) ?? '')
          .join(' ')
          .match(/-?\d+(\.\d+)?/g)
          ?.map(Number) ?? []
      )
    })

    // Nothing addresses a coordinate outside 0–20: a glyph that did would clip at any size.
    for (const value of coordinates) {
      expect(value, `${name}: ${value}`).toBeGreaterThanOrEqual(-20)
      expect(value, `${name}: ${value}`).toBeLessThanOrEqual(20)
    }
  })

  it.each(ICON_NAMES)('draws %s with at least one shape', (name) => {
    const Icon = ICON_REGISTRY[name]
    const svg = svgOf(render(<Icon />).container)

    expect(svg.querySelectorAll('path, circle, rect').length).toBeGreaterThan(0)
  })

  it('keeps every path short, since these are geometric glyphs and not traced art', () => {
    for (const name of ICON_NAMES) {
      const Icon = ICON_REGISTRY[name]
      const svg = svgOf(render(<Icon />).container)

      for (const path of svg.querySelectorAll('path')) {
        expect((path.getAttribute('d') ?? '').length, `${name}`).toBeLessThan(320)
      }
    }
  })
})
