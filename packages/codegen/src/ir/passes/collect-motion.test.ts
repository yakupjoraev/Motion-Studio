import { type MotionSpec, type Node, blockId, nodeId } from '@motion-studio/schema'
import { describe, expect, it } from 'vitest'

import { resolveOptions } from '../../options.types'
import { FIXTURE_THEME } from '../../test/documents'
import { fixturePresets, spec } from '../../test/presets'
import { toIRTheme } from '../build-ir'
import { createMotionCollector } from './collect-motion'

const node = (id: string, motion: Partial<Record<'entrance', MotionSpec>>): Node => ({
  id: nodeId(id),
  blockId: blockId('hero'),
  name: 'Hero',
  parentId: null,
  slot: 'root',
  children: [],
  props: {},
  responsive: {},
  motion,
  effects: [],
  locked: false,
  hidden: false,
})

const collector = (overrides = {}, theme = FIXTURE_THEME) =>
  createMotionCollector({
    presets: fixturePresets(),
    theme: toIRTheme(theme),
    options: resolveOptions(overrides),
  })

const fadeUp = () => spec('fade-up', { params: { distance: 32, duration: 0.6 } })

describe('hoisting', () => {
  it('emits one constant for eight sections on the same preset', () => {
    const collect = collector()

    for (let index = 0; index < 8; index += 1) {
      collect.collect(node(`node_s${index}`, { entrance: fadeUp() }))
    }

    expect([...collect.hoisted.keys()]).toEqual(['fadeUpVariants', 'fadeUpTransition'])
  })

  it('has every section reference the same names', () => {
    const collect = collector()
    const first = collect.collect(node('node_a', { entrance: fadeUp() }))
    const second = collect.collect(node('node_b', { entrance: fadeUp() }))

    expect(first.hoisted).toEqual(second.hoisted)
    expect(first.attributes['variants']).toEqual({
      kind: 'expression',
      code: 'fadeUpVariants',
    })
  })

  it('renames rather than overwrites when two nodes want the same name for different content', () => {
    const collect = collector()

    collect.collect(node('node_a', { entrance: fadeUp() }))
    const other = collect.collect(
      node('node_b', { entrance: spec('fade-up', { params: { distance: 64, duration: 0.6 } }) }),
    )

    expect(collect.hoisted.size).toBe(3)
    expect(other.attributes['variants']).not.toEqual({
      kind: 'expression',
      code: 'fadeUpVariants',
    })
    expect(String(other.hoisted[0])).toMatch(/^fadeUpVariants\w{4}$/)
  })

  it('writes the renamed constant under its new name', () => {
    const collect = collector()

    collect.collect(node('node_a', { entrance: fadeUp() }))
    const other = collect.collect(
      node('node_b', { entrance: spec('fade-up', { params: { distance: 64, duration: 0.6 } }) }),
    )
    const renamed = collect.hoisted.get(String(other.hoisted[0]))

    expect(renamed?.code.startsWith(`const ${renamed?.name} =`)).toBe(true)
  })
})

/**
 * ADR-255. A document stores what the inspector changed, so half a param set is the normal case; the
 * arithmetic a preset does on a missing one produces `NaN`, which prints as `null` and fails to
 * compile against Motion's `Transition`.
 */
describe('preset params', () => {
  it('fills a param the document never stored with the preset default', () => {
    const collect = collector()

    collect.collect(node('node_a', { entrance: spec('fade-up', { params: { distance: 64 } }) }))

    expect(collect.hoisted.get('fadeUpTransition')?.code).toContain('duration: 0.6')
  })

  it('falls back to the whole default set when the params do not parse', () => {
    const collect = collector()

    collect.collect(node('node_a', { entrance: spec('fade-up', { params: { distance: 'wide' } }) }))

    expect(collect.hoisted.get('fadeUpVariants')?.code).toContain('y: 32')
  })
})

describe('reduced motion', () => {
  it('is emitted unconditionally for a Motion-engine preset', () => {
    const result = collector().collect(node('node_a', { entrance: fadeUp() }))

    expect(result.hooks).toEqual(['const shouldReduceMotion = useReducedMotion()'])
    expect(result.attributes['initial']).toEqual({
      kind: 'expression',
      code: "shouldReduceMotion ? 'visible' : 'hidden'",
    })
    expect(result.attributes['transition']).toEqual({
      kind: 'expression',
      code: 'shouldReduceMotion ? { duration: 0 } : fadeUpTransition',
    })
  })

  it('imports the hook it calls', () => {
    const result = collector().collect(node('node_a', { entrance: fadeUp() }))

    expect(result.imports).toContainEqual({
      from: 'motion/react',
      named: ['motion', 'useReducedMotion'],
    })
  })

  it('is a media query for a CSS-engine preset, which cannot branch on a hook', () => {
    const collect = collector()
    const result = collect.collect(node('node_a', { entrance: spec('shine') }))

    expect(result.classNames).toEqual(['ms-shine'])
    expect(collect.rules).toEqual([
      {
        selector: '.ms-shine',
        declarations: ['animation: none', 'transition: none'],
        media: '(prefers-reduced-motion: reduce)',
      },
    ])
  })

  it('collects the keyframes a CSS preset needs, once', () => {
    const collect = collector()

    collect.collect(node('node_a', { entrance: spec('shine') }))
    collect.collect(node('node_b', { entrance: spec('shine') }))

    expect(collect.keyframes).toHaveLength(1)
  })
})

describe('the element', () => {
  it('takes the motion prefix onto its own tag rather than gaining a wrapper', () => {
    expect(collector().collect(node('node_a', { entrance: fadeUp() })).tagPrefix).toBe('motion.')
  })

  it('gains nothing when the preset has no wrapper', () => {
    const result = collector().collect(node('node_a', { entrance: spec('scroll-parallax') }))

    expect(result.tagPrefix).toBeUndefined()
    expect(result.hooks).toEqual(['useGsapParallax(ref)'])
  })
})

describe('dependencies', () => {
  it('accumulates a real range and says so in the report', () => {
    const collect = collector()

    collect.collect(node('node_a', { entrance: fadeUp() }))

    expect(collect.dependencies).toEqual({ motion: '^11.18.2' })
    expect(collect.warnings.map((entry) => entry.message)).toContain('Adds motion@^11.18.2.')
  })

  it('names a package once however many nodes use it', () => {
    const collect = collector()

    collect.collect(node('node_a', { entrance: fadeUp() }))
    collect.collect(node('node_b', { entrance: fadeUp() }))

    expect(collect.warnings.filter((entry) => entry.code === 'dependency')).toHaveLength(1)
  })

  it('collects a GSAP import only when a GSAP preset is present', () => {
    const withoutGsap = collector()

    withoutGsap.collect(node('node_a', { entrance: fadeUp() }))
    expect(withoutGsap.dependencies['gsap']).toBeUndefined()

    const withGsap = collector()

    withGsap.collect(node('node_a', { entrance: spec('scroll-parallax') }))
    expect(withGsap.dependencies['gsap']).toBe('^3.15.0')
  })
})

describe('what it refuses to do quietly', () => {
  it('reports a preset it cannot find and animates nothing', () => {
    const collect = collector()
    const result = collect.collect(node('node_a', { entrance: spec('no-such-preset') }))

    expect(result.attributes).toEqual({})
    expect(collect.warnings[0]?.code).toBe('unsupported')
    expect(collect.warnings[0]?.nodeId).toBe('node_a')
  })

  it('reports a stagger the exported transition does not carry', () => {
    const collect = collector()

    collect.collect(
      node('node_a', { entrance: spec('fade-up', { stagger: { each: 80, from: 'first' } }) }),
    )

    expect(collect.warnings.filter((entry) => entry.code === 'approximation')).toHaveLength(1)
  })

  it('reports a theme motion scale the exported durations do not carry', () => {
    const collect = collector({}, { ...FIXTURE_THEME, motionScale: 0.5 })

    expect(collect.warnings[0]?.code).toBe('approximation')
    expect(collect.warnings[0]?.message).toContain('0.5')
  })
})

describe('the options', () => {
  it('emits nothing at all when motion is excluded', () => {
    const collect = collector({ includeMotion: false })
    const result = collect.collect(node('node_a', { entrance: fadeUp() }))

    expect(result.attributes).toEqual({})
    expect(collect.hoisted.size).toBe(0)
  })

  it('skips a disabled spec, so removing the motion removes its import', () => {
    const collect = collector()
    const result = collect.collect(
      node('node_a', { entrance: spec('fade-up', { disabled: true }) }),
    )

    expect(result.imports).toEqual([])
    expect(collect.dependencies).toEqual({})
  })
})
