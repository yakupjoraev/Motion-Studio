import { describe, expect, it } from 'vitest'

import { MIN_STOPS, addStop, moveStop, removeStop, setStopColor } from './stop-list'

import type { ColorStop } from '@motion-studio/tokens'

const STOPS: readonly ColorStop[] = [
  { color: 'oklch(0% 0 0)', position: 0 },
  { color: 'oklch(50% 0 0)', position: 40 },
  { color: 'oklch(100% 0 0)', position: 100 },
]

describe('moveStop', () => {
  it('moves the stop it was pointed at', () => {
    expect(moveStop(STOPS, 1, 60).stops[1]).toEqual({ color: 'oklch(50% 0 0)', position: 60 })
  })

  it('holds a stop inside the track', () => {
    expect(moveStop(STOPS, 1, 140).stops.at(-1)?.position).toBe(100)
    expect(moveStop(STOPS, 1, -40).stops[0]?.position).toBe(0)
  })

  it('re-sorts when a stop passes another, and the selection follows the stop', () => {
    const edit = moveStop(STOPS, 0, 80)

    expect(edit.stops.map((stop) => stop.position)).toEqual([40, 80, 100])
    expect(edit.selected).toBe(1)
    expect(edit.stops[edit.selected]?.color).toBe('oklch(0% 0 0)')
  })

  it('rounds to whole percentages, which is the resolution a stop is stored at', () => {
    expect(moveStop(STOPS, 1, 42.6).stops[1]?.position).toBe(43)
  })

  it('leaves an index it has no stop for alone', () => {
    expect(moveStop(STOPS, 9, 50).stops).toBe(STOPS)
  })
})

describe('setStopColor', () => {
  it('recolours one stop and moves none', () => {
    const edit = setStopColor(STOPS, 2, 'oklch(58% 0.18 285)')

    expect(edit.stops[2]).toEqual({ color: 'oklch(58% 0.18 285)', position: 100 })
    expect(edit.selected).toBe(2)
  })
})

describe('addStop', () => {
  it('lands half way to the next stop', () => {
    const edit = addStop(STOPS, 1)

    expect(edit.stops).toHaveLength(4)
    expect(edit.stops[edit.selected]?.position).toBe(70)
  })

  it('takes the colour of the stop it was added from rather than guessing at a blend', () => {
    expect(addStop(STOPS, 0).stops[addStop(STOPS, 0).selected]?.color).toBe('oklch(0% 0 0)')
  })

  it('runs to the end of the track when added from the last stop', () => {
    const edit = addStop(STOPS, 2)

    expect(edit.stops[edit.selected]?.position).toBe(100)
  })

  it('leaves an index it has no stop for alone', () => {
    expect(addStop(STOPS, 9).stops).toBe(STOPS)
  })
})

describe('removeStop', () => {
  it('removes the stop it was pointed at', () => {
    expect(removeStop(STOPS, 1).stops.map((stop) => stop.position)).toEqual([0, 100])
  })

  it('selects the stop that took its place', () => {
    expect(removeStop(STOPS, 2).selected).toBe(1)
  })

  it('refuses to go below two stops, which is the fewest a gradient can be drawn from', () => {
    const pair = STOPS.slice(0, MIN_STOPS)

    expect(removeStop(pair, 0).stops).toBe(pair)
  })
})
