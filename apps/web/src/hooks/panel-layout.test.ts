import { describe, expect, it } from 'vitest'

import {
  DEFAULT_PANEL_LAYOUT,
  PANEL_BOUNDS,
  PANEL_LAYOUT_KEY,
  PANEL_LAYOUT_SCRIPT,
  PANEL_VARIABLE,
  isCollapsed,
  parsePanelLayout,
  trackWidth,
} from './panel-layout'

const readVariable = (name: string): string => document.documentElement.style.getPropertyValue(name)

/** The boot script runs as itself, not as a re-implementation — that is the whole point of testing it. */
const runBootScript = (stored: string | null): void => {
  document.documentElement.removeAttribute('style')
  window.localStorage.clear()

  if (stored !== null) {
    window.localStorage.setItem(PANEL_LAYOUT_KEY, stored)
  }

  new Function(PANEL_LAYOUT_SCRIPT)()
}

describe('parsePanelLayout', () => {
  it('falls back to the defaults when nothing is stored', () => {
    expect(parsePanelLayout(null)).toEqual(DEFAULT_PANEL_LAYOUT)
  })

  it('falls back when the value is not JSON', () => {
    expect(parsePanelLayout('{ not json')).toEqual(DEFAULT_PANEL_LAYOUT)
  })

  it.each(['null', '"280"', '42', '[]'])('falls back when the value is %s', (raw) => {
    // An array parses as an object, so it reaches the field reads and every field falls back.
    expect(parsePanelLayout(raw)).toEqual(DEFAULT_PANEL_LAYOUT)
  })

  it('clamps a width below the minimum', () => {
    expect(parsePanelLayout(JSON.stringify({ left: 10 })).left).toBe(PANEL_BOUNDS.left.min)
  })

  it('clamps a width above the maximum', () => {
    expect(parsePanelLayout(JSON.stringify({ right: 9000 })).right).toBe(PANEL_BOUNDS.right.max)
  })

  it.each([Number.NaN, Number.POSITIVE_INFINITY, '300', null])(
    'falls back to the default width for %s',
    (left) => {
      expect(parsePanelLayout(JSON.stringify({ left })).left).toBe(PANEL_BOUNDS.left.initial)
    },
  )

  it('reads collapse as a strict boolean', () => {
    const layout = parsePanelLayout(JSON.stringify({ leftCollapsed: 'yes', rightCollapsed: true }))

    expect(layout.leftCollapsed).toBe(false)
    expect(layout.rightCollapsed).toBe(true)
  })

  it('keeps a width inside the bounds untouched', () => {
    expect(parsePanelLayout(JSON.stringify({ left: 301, right: 401 }))).toEqual({
      left: 301,
      right: 401,
      leftCollapsed: false,
      rightCollapsed: false,
    })
  })
})

describe('trackWidth', () => {
  it('is the stored width while the panel is open', () => {
    expect(trackWidth({ ...DEFAULT_PANEL_LAYOUT, left: 320 }, 'left')).toBe(320)
  })

  it('is zero while the panel is collapsed', () => {
    expect(trackWidth({ ...DEFAULT_PANEL_LAYOUT, leftCollapsed: true }, 'left')).toBe(0)
  })

  it('reports collapse per side', () => {
    const layout = { ...DEFAULT_PANEL_LAYOUT, rightCollapsed: true }

    expect(isCollapsed(layout, 'left')).toBe(false)
    expect(isCollapsed(layout, 'right')).toBe(true)
  })
})

describe('PANEL_LAYOUT_SCRIPT', () => {
  it('writes nothing when nothing is stored, so the stylesheet defaults stand', () => {
    runBootScript(null)

    expect(readVariable(PANEL_VARIABLE.left.track)).toBe('')
  })

  it('restores a stored width before any React runs', () => {
    runBootScript(JSON.stringify({ left: 340, right: 300 }))

    expect(readVariable(PANEL_VARIABLE.left.track)).toBe('340px')
    expect(readVariable(PANEL_VARIABLE.right.track)).toBe('300px')
  })

  it('zeroes the track of a collapsed panel but keeps its size', () => {
    runBootScript(JSON.stringify({ left: 340, leftCollapsed: true }))

    expect(readVariable(PANEL_VARIABLE.left.track)).toBe('0px')
    expect(readVariable(PANEL_VARIABLE.left.size)).toBe('340px')
  })

  it('clamps a corrupt width to the same bounds the hook uses', () => {
    runBootScript(JSON.stringify({ left: 5, right: 'wide' }))

    expect(readVariable(PANEL_VARIABLE.left.track)).toBe(`${PANEL_BOUNDS.left.min}px`)
    expect(readVariable(PANEL_VARIABLE.right.track)).toBe(`${PANEL_BOUNDS.right.initial}px`)
  })

  it('survives a value that is not JSON at all', () => {
    expect(() => runBootScript('{ not json')).not.toThrow()
    expect(readVariable(PANEL_VARIABLE.left.track)).toBe('')
  })
})
