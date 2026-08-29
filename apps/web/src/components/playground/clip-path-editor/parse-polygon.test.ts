import { normalizeCssValue } from '@motion-studio/schema/css'
import { describe, expect, it } from 'vitest'

import {
  MIN_VERTICES,
  convertUnit,
  insertVertex,
  parsePolygon,
  removeVertex,
  serializePolygon,
} from './parse-polygon'
import { POLYGON_PRESETS, SHAPE_PRESETS } from './shape-presets'

describe('parsePolygon', () => {
  it('round-trips every polygon preset exactly', () => {
    expect(POLYGON_PRESETS.length).toBeGreaterThan(0)

    for (const preset of POLYGON_PRESETS) {
      const parsed = parsePolygon(preset.value)

      expect(parsed.ok, `${preset.name} parses`).toBe(true)

      if (parsed.ok) {
        expect(
          serializePolygon(parsed.value.vertices, parsed.value.unit, parsed.value.fillRule),
          preset.name,
        ).toBe(normalizeCssValue(preset.value))
      }
    }
  })

  it('leaves the shapes that are not polygons to their own controls', () => {
    const others = SHAPE_PRESETS.filter((preset) => !preset.value.startsWith('polygon('))

    expect(others.length).toBeGreaterThan(0)

    for (const preset of others) {
      expect(parsePolygon(preset.value).ok, preset.name).toBe(false)
    }
  })

  it('keeps a fill rule and puts it back where it was', () => {
    const value = 'polygon(evenodd, 0% 0%, 100% 0%, 50% 100%)'
    const parsed = parsePolygon(value)

    expect(parsed.ok && parsed.value.fillRule).toBe('evenodd')

    if (parsed.ok) {
      expect(serializePolygon(parsed.value.vertices, '%', parsed.value.fillRule)).toBe(value)
    }
  })

  it('reads a pixel polygon as pixels', () => {
    const parsed = parsePolygon('polygon(0px 0px, 200px 0px, 100px 150px)')

    expect(parsed.ok && parsed.value.unit).toBe('px')
  })

  it('takes a bare zero into the shape’s own unit', () => {
    const parsed = parsePolygon('polygon(0 0, 100% 0%, 50% 100%)')

    expect(parsed.ok && parsed.value.unit).toBe('%')
    expect(parsed.ok && parsed.value.vertices[0]).toEqual({ x: 0, y: 0 })
  })

  it('refuses a shape whose coordinates disagree about the unit', () => {
    const parsed = parsePolygon('polygon(0px 0%, 100% 0%, 50% 100%)')

    expect(parsed.ok).toBe(false)
    expect(!parsed.ok && parsed.error.message).toContain('Mixed units')
  })

  it('refuses fewer than three vertices', () => {
    const parsed = parsePolygon('polygon(0% 0%, 100% 100%)')

    expect(parsed.ok).toBe(false)
    expect(!parsed.ok && parsed.error.message).toContain(String(MIN_VERTICES))
  })

  it('refuses a shape that is not a polygon at all', () => {
    expect(parsePolygon('circle(40%)').ok).toBe(false)
    expect(parsePolygon('url(evil.svg#a)').ok).toBe(false)
  })
})

describe('editing the ring', () => {
  const triangle = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 50, y: 100 },
  ]

  it('inserts on the midpoint of the edge that was clicked', () => {
    expect(insertVertex(triangle, 0)).toEqual([
      { x: 0, y: 0 },
      { x: 50, y: 0 },
      { x: 100, y: 0 },
      { x: 50, y: 100 },
    ])
  })

  it('closes the ring when the last edge is the one split', () => {
    expect(insertVertex(triangle, 2)[3]).toEqual({ x: 25, y: 50 })
  })

  it('removes a vertex', () => {
    expect(removeVertex([...triangle, { x: 0, y: 100 }], 1)).toHaveLength(3)
  })

  it('keeps the last three', () => {
    expect(removeVertex(triangle, 1)).toEqual(triangle)
  })
})

describe('convertUnit', () => {
  const size = { width: 400, height: 200 }

  it('turns percentages into pixels against the target size', () => {
    expect(convertUnit([{ x: 50, y: 25 }], '%', 'px', size)).toEqual([{ x: 200, y: 50 }])
  })

  it('turns pixels back into percentages', () => {
    expect(convertUnit([{ x: 200, y: 50 }], 'px', '%', size)).toEqual([{ x: 50, y: 25 }])
  })

  it('is a no-op when the unit does not change', () => {
    const vertices = [{ x: 50, y: 25 }]

    expect(convertUnit(vertices, '%', '%', size)).toBe(vertices)
  })

  it('leaves the values alone rather than dividing by a zero-sized target', () => {
    const vertices = [{ x: 50, y: 25 }]

    expect(convertUnit(vertices, '%', 'px', { width: 0, height: 0 })).toBe(vertices)
  })
})

describe('serializePolygon', () => {
  it('trims a trailing zero rather than printing 50.00%', () => {
    expect(
      serializePolygon(
        [
          { x: 50, y: 0 },
          { x: 100, y: 33.333 },
          { x: 0, y: 100 },
        ],
        '%',
      ),
    ).toBe('polygon(50% 0%, 100% 33.33%, 0% 100%)')
  })
})
