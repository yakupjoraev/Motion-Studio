import type { NodeId } from '@motion-studio/schema'
import { describe, expect, it } from 'vitest'

import { type ScreenRect, screenPoint, screenRect } from '../coords/index'
import type { RectCache } from '../rects/rect-cache'
import { fakeScene } from '../test/scene'

import { marqueeHits, marqueeRect } from './marquee'

const cacheOf = (entries: Record<string, ScreenRect>): RectCache => ({
  get: (id) => entries[id],
  invalidate: () => undefined,
  refresh: () => undefined,
  observe: () => () => undefined,
  subscribe: () => () => undefined,
})

const fake = fakeScene({
  root: { children: ['a', 'b', 'c'] },
  a: {},
  b: {},
  c: {},
})

const CANDIDATES: readonly NodeId[] = ['a', 'b', 'c'].map(fake.id)

const cache = cacheOf({
  [fake.id('a')]: screenRect({ x: 0, y: 0, width: 100, height: 100 }),
  [fake.id('b')]: screenRect({ x: 150, y: 0, width: 100, height: 100 }),
  // 'c' is deliberately absent: a node whose rect has not been read is not a hit — ADR-079.
})

describe('marqueeRect', () => {
  it('normalises two corners dragged in any direction', () => {
    expect(marqueeRect(screenPoint(120, 90), screenPoint(20, 10))).toEqual({
      x: 20,
      y: 10,
      width: 100,
      height: 80,
    })
  })
})

describe('marqueeHits', () => {
  it('takes partial overlap by default', () => {
    const band = screenRect({ x: 90, y: 40, width: 80, height: 20 })

    expect(marqueeHits(band, cache, CANDIDATES, 'intersect')).toEqual([fake.id('a'), fake.id('b')])
  })

  it('requires full containment with Alt', () => {
    const band = screenRect({ x: 90, y: 40, width: 80, height: 20 })

    expect(marqueeHits(band, cache, CANDIDATES, 'contain')).toEqual([])
  })

  it('contains a node only when the band covers all of it', () => {
    const band = screenRect({ x: -10, y: -10, width: 130, height: 130 })

    expect(marqueeHits(band, cache, CANDIDATES, 'contain')).toEqual([fake.id('a')])
  })

  it('treats a zero-area band as the point it is, per the geometry helpers', () => {
    const inside = screenRect({ x: 50, y: 50, width: 0, height: 0 })
    const outside = screenRect({ x: 120, y: 50, width: 0, height: 0 })

    expect(marqueeHits(inside, cache, CANDIDATES, 'intersect')).toEqual([fake.id('a')])
    expect(marqueeHits(outside, cache, CANDIDATES, 'intersect')).toEqual([])
  })

  it('catches every candidate when the band covers the artboard', () => {
    const band = screenRect({ x: -1000, y: -1000, width: 4000, height: 4000 })

    expect(marqueeHits(band, cache, CANDIDATES, 'intersect')).toEqual([fake.id('a'), fake.id('b')])
  })

  it('is scoped to the candidates it is given, not to everything in the cache', () => {
    const band = screenRect({ x: -1000, y: -1000, width: 4000, height: 4000 })

    expect(marqueeHits(band, cache, [fake.id('b')], 'intersect')).toEqual([fake.id('b')])
  })

  it('does not catch a node the band only touches', () => {
    const band = screenRect({ x: 100, y: 0, width: 50, height: 100 })

    expect(marqueeHits(band, cache, CANDIDATES, 'intersect')).toEqual([])
  })
})
