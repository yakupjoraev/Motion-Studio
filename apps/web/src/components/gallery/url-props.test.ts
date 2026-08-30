import { blockRegistry } from '@motion-studio/blocks/registry'
import { blockId } from '@motion-studio/schema'
import { beforeEach, describe, expect, it } from 'vitest'

import { editablePaths, readParams, writeParams } from './url-props'

const aurora = blockRegistry.require(blockId('aurora-background'))
const heroSplit = blockRegistry.require(blockId('hero-split'))

const params = (query: string) => new URLSearchParams(query)

describe('reading a tuned block out of a URL', () => {
  it('takes the values the schema accepts', () => {
    const { props, rejected, modified } = readParams(aurora, params('blur=32&speed=0.6'))

    expect(props).toMatchObject({ blur: 32, speed: 0.6 })
    expect(rejected).toEqual([])
    expect(modified).toBe(true)
  })

  it('falls back to the default for a value the schema rejects, and says which', () => {
    // `blur` is `min(24).max(160)`, so 4000 is out of range rather than the wrong type.
    const { props, rejected } = readParams(aurora, params('blur=4000'))

    expect(props).toMatchObject({ blur: aurora.defaults['blur'] })
    expect(rejected).toEqual(['blur'])
  })

  it('rejects a value of the wrong type without touching the rest', () => {
    const { props, rejected } = readParams(aurora, params('blur=banana&speed=0.5'))

    expect(props).toMatchObject({ blur: aurora.defaults['blur'], speed: 0.5 })
    expect(rejected).toEqual(['blur'])
  })

  it('ignores a parameter that is not a control on this block', () => {
    const { props, rejected, modified } = readParams(aurora, params('onmouseover=alert(1)'))

    expect(props).toEqual(aurora.propsSchema.parse(aurora.defaults))
    expect(rejected).toEqual([])
    expect(modified).toBe(false)
  })

  it('reads booleans and strings, not only numbers', () => {
    const { props } = readParams(aurora, params('grain=false&tint=info'))

    expect(props).toMatchObject({ grain: false, tint: 'info' })
  })

  it('is the defaults when there is no query string at all', () => {
    const { props, modified } = readParams(aurora, params(''))

    expect(props).toEqual(aurora.propsSchema.parse(aurora.defaults))
    expect(modified).toBe(false)
  })
})

describe('writing the URL back', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/blocks/aurora-background')
  })

  it('round-trips a tuned block through the address bar', () => {
    const tuned = { ...aurora.propsSchema.parse(aurora.defaults), blur: 32, speed: 0.6 }

    writeParams(aurora, tuned)

    const reopened = readParams(aurora, new URLSearchParams(window.location.search))

    expect(reopened.props).toEqual(tuned)
    expect(reopened.rejected).toEqual([])
  })

  it('carries what changed and not a census of what did not', () => {
    writeParams(aurora, { ...aurora.propsSchema.parse(aurora.defaults), blur: 32 })

    expect(window.location.search).toBe('?blur=32')
  })

  it('drops the query string entirely once everything is back to its default', () => {
    writeParams(aurora, { ...aurora.propsSchema.parse(aurora.defaults), blur: 32 })
    writeParams(aurora, aurora.propsSchema.parse(aurora.defaults))

    expect(window.location.search).toBe('')
    expect(window.location.pathname).toBe('/blocks/aurora-background')
  })

  it('leaves one history entry per commit rather than one per frame', () => {
    const before = window.history.length

    for (const blur of [30, 32, 34, 36]) {
      writeParams(aurora, { ...aurora.propsSchema.parse(aurora.defaults), blur })
    }

    expect(window.history.length).toBe(before)
  })
})

describe('which props travel', () => {
  it('is every top-level control on the block', () => {
    expect(editablePaths(aurora)).toEqual(
      new Set(['tint', 'secondaryTint', 'intensity', 'blur', 'grain', 'scrim', 'speed']),
    )
  })

  it('leaves out a dot path, which addresses a nested object', () => {
    for (const path of editablePaths(heroSplit)) {
      expect(path).not.toContain('.')
    }
  })
})
