import { describe, expect, it } from 'vitest'

import { BLUR } from './blur'
import { DURATION } from './duration'
import { EASING } from './easing'
import { GLASS } from './glass'
import { RADIUS } from './radius'
import { SPACE } from './space'
import { FONT_WEIGHT, TYPE_SCALE } from './type'
import { Z_INDEX } from './z-index'

/**
 * These are data tables transcribed from `DESIGN_SYSTEM.md`, so they have no branches to cover. What
 * they do have is invariants the document states in prose, and a transcription typo breaks one of
 * them silently — a swapped digit in a line height is invisible in review and visible in every block.
 */

const pixels = (value: string): number => Number.parseFloat(value)

describe('SPACE', () => {
  it('is a multiple of the 4px base at every step', () => {
    for (const [multiple, value] of Object.entries(SPACE)) {
      expect(pixels(value)).toBe(Number(multiple) * 4)
    }
  })

  it('ascends', () => {
    const values = Object.values(SPACE).map(pixels)

    expect(values).toEqual([...values].sort((a, b) => a - b))
  })

  it('has the 17 steps the scale documents', () => {
    expect(Object.keys(SPACE)).toHaveLength(17)
  })
})

describe('RADIUS', () => {
  it('ascends from none to full', () => {
    const values = Object.values(RADIUS).map(pixels)

    expect(values).toEqual([...values].sort((a, b) => a - b))
  })

  it('starts at zero', () => {
    expect(pixels(RADIUS.none)).toBe(0)
  })

  it('uses a large pixel value for full rather than a percentage, so a pill keeps its shape', () => {
    expect(RADIUS.full).toBe('9999px')
  })
})

describe('TYPE_SCALE', () => {
  it('ascends in size across the fixed steps', () => {
    const fixed = Object.values(TYPE_SCALE).filter((entry) => entry.size.endsWith('px'))
    const sizes = fixed.map((entry) => pixels(entry.size))

    expect(sizes).toEqual([...sizes].sort((a, b) => a - b))
  })

  it('gives every fixed step a line height above its size', () => {
    for (const entry of Object.values(TYPE_SCALE)) {
      if (entry.size.endsWith('px') && entry.lineHeight.endsWith('px')) {
        expect(pixels(entry.lineHeight)).toBeGreaterThan(pixels(entry.size))
      }
    }
  })

  it('tightens tracking as size grows and loosens it as size shrinks', () => {
    // The optical rule the table encodes: small text needs air, large text needs less.
    expect(pixels(TYPE_SCALE['2xs'].tracking)).toBeGreaterThan(0)
    expect(pixels(TYPE_SCALE.base.tracking)).toBe(0)
    expect(pixels(TYPE_SCALE['6xl'].tracking)).toBeLessThan(0)
  })

  it('makes the studio default 14px and the page body 16px', () => {
    expect(TYPE_SCALE.base.size).toBe('14px')
    expect(TYPE_SCALE.md.size).toBe('16px')
  })

  it('gives the fluid display steps a unitless line height, so it tracks the clamped size', () => {
    expect(TYPE_SCALE['display-1'].size.startsWith('clamp(')).toBe(true)
    expect(TYPE_SCALE['display-1'].lineHeight).toBe('1.05')
    expect(TYPE_SCALE['display-2'].lineHeight).toBe('1.1')
  })
})

describe('FONT_WEIGHT', () => {
  it('omits 300, which fails contrast at small sizes on dark surfaces', () => {
    expect(Object.values(FONT_WEIGHT)).not.toContain(300)
  })

  it('carries exactly the four documented weights', () => {
    expect(Object.values(FONT_WEIGHT)).toEqual([400, 500, 600, 700])
  })
})

describe('BLUR', () => {
  it('ascends from none', () => {
    const values = Object.values(BLUR).map(pixels)

    expect(values).toEqual([...values].sort((a, b) => a - b))
    expect(pixels(BLUR.none)).toBe(0)
  })
})

describe('GLASS', () => {
  it('gives every recipe all three parts, since none of them reads as glass alone', () => {
    for (const recipe of Object.values(GLASS)) {
      expect(recipe.backdropFilter).toMatch(/^blur\(/)
      expect(recipe.background).toMatch(/^oklch\(/)
      expect(recipe.border).toMatch(/^oklch\(/)
    }
  })

  it('increases blur from subtle to frosted', () => {
    const blurs = Object.values(GLASS).map((recipe) => pixels(recipe.backdropFilter.slice(5)))

    expect(blurs).toEqual([...blurs].sort((a, b) => a - b))
  })

  it('pairs a stronger blur with a more opaque fill and border', () => {
    const alpha = (color: string): number => pixels(color.split('/')[1] ?? '0')

    expect(alpha(GLASS.subtle.background)).toBeLessThan(alpha(GLASS.strong.background))
    expect(alpha(GLASS.subtle.border)).toBeLessThan(alpha(GLASS.strong.border))
  })
})

describe('DURATION', () => {
  it('ascends from instant', () => {
    const values = Object.values(DURATION)

    expect(values).toEqual([...values].sort((a, b) => a - b))
    expect(DURATION.instant).toBe(0)
  })

  it('keeps every duration in milliseconds, so motionScale can multiply it', () => {
    for (const value of Object.values(DURATION)) {
      expect(Number.isInteger(value)).toBe(true)
    }
  })
})

describe('EASING', () => {
  it('gives every curve four control points', () => {
    for (const curve of Object.values(EASING)) {
      expect(curve).toHaveLength(4)
    }
  })

  it('keeps both x controls inside 0-1, which cubic-bezier requires', () => {
    for (const [x1, , x2] of Object.values(EASING)) {
      expect(x1).toBeGreaterThanOrEqual(0)
      expect(x1).toBeLessThanOrEqual(1)
      expect(x2).toBeGreaterThanOrEqual(0)
      expect(x2).toBeLessThanOrEqual(1)
    }
  })

  it('lets only the overshoot curves leave 0-1 on y', () => {
    const overshoots = Object.entries(EASING)
      .filter(([, [, y1, , y2]]) => y1 < 0 || y1 > 1 || y2 < 0 || y2 > 1)
      .map(([name]) => name)

    expect(overshoots.sort()).toEqual(['anticipate', 'bounce', 'spring'])
  })
})

describe('Z_INDEX', () => {
  it('has no duplicate layer, so no two layers can tie', () => {
    const values = Object.values(Z_INDEX)

    expect(new Set(values).size).toBe(values.length)
  })

  it('ascends in the documented order', () => {
    const values = Object.values(Z_INDEX)

    expect(values).toEqual([...values].sort((a, b) => a - b))
  })

  it('keeps every canvas layer below every chrome layer', () => {
    expect(Z_INDEX.canvasHandles).toBeLessThan(Z_INDEX.panel)
  })

  it('puts the command palette above every other layer', () => {
    expect(Z_INDEX.commandPalette).toBe(Math.max(...Object.values(Z_INDEX)))
  })
})
