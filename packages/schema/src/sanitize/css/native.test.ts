import { afterEach, describe, expect, it, vi } from 'vitest'

import { blameFeature, detectFeatures, supportsDeclaration } from './native'

afterEach(() => {
  vi.unstubAllGlobals()
})

/** The schema runs under `node`, where there is no `CSS`. Stubbing it is how layer 3 is exercised. */
const withSupports = (supports: (property: string, value: string) => boolean): void => {
  vi.stubGlobal('CSS', { supports })
}

describe('supportsDeclaration — ADR-268', () => {
  it('reports unverified rather than refusing where there is no CSS API', () => {
    expect(supportsDeclaration('box-shadow', 'banana')).toEqual({ ok: true, unverified: true })
  })

  it('reports unverified when CSS exists without supports', () => {
    vi.stubGlobal('CSS', {})

    expect(supportsDeclaration('color', 'red')).toEqual({ ok: true, unverified: true })
  })

  it('asks the browser and reports a verified answer', () => {
    withSupports((property, value) => property === 'color' && value === 'red')

    expect(supportsDeclaration('color', 'red')).toEqual({ ok: true, unverified: false })
    expect(supportsDeclaration('box-shadow', 'banana')).toEqual({ ok: false, unverified: false })
  })

  it('treats a host whose API throws as one that cannot answer', () => {
    withSupports(() => {
      throw new Error('no')
    })

    expect(supportsDeclaration('color', 'red')).toEqual({ ok: true, unverified: true })
  })
})

describe('detectFeatures', () => {
  it.each([
    ['oklch()', 'background', 'oklch(62% 0.19 285)', 'oklch'],
    ['color-mix()', 'background', 'color-mix(in oklab, red, blue)', 'color-mix'],
    ['light-dark()', 'background', 'light-dark(#fff, #000)', 'light-dark'],
    ['container units', 'width', 'clamp(20cqw, 50%, 40rem)', 'container-units'],
  ])('finds %s in a value', (_label, property, value, id) => {
    expect(detectFeatures(property, value).map((feature) => feature.id)).toContain(id)
  })

  it.each(['backdrop-filter', 'clip-path', 'mask-image'])('finds %s as a property', (property) => {
    expect(detectFeatures(property, 'none').map((feature) => feature.id)).toContain(property)
  })

  it('carries the note a reader needs, not only the name', () => {
    const feature = detectFeatures('background', 'oklch(62% 0.19 285)')[0]

    expect(feature).toMatchObject({ label: 'oklch()', support: 'Safari 15.4+, Chrome 111+' })
  })

  it('says nothing about a value that uses nothing recent', () => {
    expect(detectFeatures('color', 'red')).toEqual([])
  })
})

describe('blameFeature', () => {
  it('blames the construct in the value', () => {
    expect(blameFeature('oklch(62% 0.19 285)')?.id).toBe('oklch')
  })

  it('blames nothing when the value is plain, so the message stays about the value', () => {
    expect(blameFeature('banana')).toBeUndefined()
  })
})
