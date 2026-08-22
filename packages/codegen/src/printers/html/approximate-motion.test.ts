import { describe, expect, it } from 'vitest'

import type { CodegenIR, IRElement, IRElementMotion } from '../../ir/ir.types'
import { FIXTURE_THEME } from '../../test/documents'

import { REVEAL_CLASS, approximateMotion, approximationRules } from './approximate-motion'

/**
 * Prompt 44's rule, checked row by row: "Every approximation and omission appears in the export
 * warnings." A row that degrades silently is the defect; a row that degrades loudly is the feature.
 */
const element = (
  motion: readonly IRElementMotion[],
  children: readonly IRElement[] = [],
): IRElement => ({
  kind: 'element',
  tag: 'section',
  classNames: [],
  attributes: {},
  children,
  ...(motion.length === 0 ? {} : { motion }),
})

const preset = (
  presetId: string,
  engine: IRElementMotion['engine'] = 'motion',
  channel = 'entrance',
): IRElementMotion => ({ presetId, engine, channel })

const irWith = (root: IRElement): CodegenIR => ({
  components: [
    {
      name: 'Page',
      fileName: 'page.tsx',
      props: [],
      imports: [],
      hoisted: [],
      hooks: [],
      client: { emit: false, reason: 'fixture' },
      root,
      usedClasses: [],
    },
  ],
  entry: 'Page',
  documentName: 'Fixture',
  theme: {
    id: 'fixture',
    name: 'Fixture',
    colorMode: 'dark',
    fontPairing: 'geist',
    radiusScale: 1,
    spacingScale: 1,
    motionScale: 1,
    config: FIXTURE_THEME,
  },
  assets: [],
  stylesheet: { rules: [], keyframes: [] },
  modules: [],
  dependencies: {},
  warnings: [],
})

describe('approximateMotion', () => {
  it('translates a fade entrance faithfully, with no warning', () => {
    const result = approximateMotion(irWith(element([preset('fade-up')])))

    expect([...result.classNames.values()][0]).toEqual([REVEAL_CLASS])
    expect(result.features).toEqual(new Set(['reveal']))
    expect(result.warnings).toEqual([])
  })

  it('leaves a css-engine preset alone, because its own fragment already ran', () => {
    const result = approximateMotion(irWith(element([preset('shine', 'css', 'hover')])))

    expect(result.classNames.size).toBe(0)
    expect(result.warnings).toEqual([])
  })

  it.each([
    ['magnetic', 'css', 'approximation', 'no cursor tracking'],
    ['scale-in', 'motion', 'approximation', 'spring physics → bezier'],
    ['sticky-stack', 'css', 'approximation', 'no scale interpolation'],
    ['particles', 'motion', 'unsupported', 'requires WebGL'],
    ['scroll-timeline', 'gsap', 'unsupported', 'requires a scroll timeline'],
    ['typewriter', 'motion', 'unsupported', 'per-character script'],
  ])('names what %s lost', (presetId, engine, code, fragment) => {
    const result = approximateMotion(
      irWith(element([preset(presetId, engine as IRElementMotion['engine'])])),
    )

    expect(result.warnings).toHaveLength(1)
    expect(result.warnings[0]?.code).toBe(code)
    expect(result.warnings[0]?.message).toContain(fragment)
    expect(result.warnings[0]?.message).toContain(presetId)
  })

  it('degrades a preset the table does not name, by engine, and says so', () => {
    const motion = approximateMotion(irWith(element([preset('brand-new-entrance', 'motion')])))
    const gsap = approximateMotion(irWith(element([preset('brand-new-scroll', 'gsap')])))

    expect(motion.warnings[0]?.message).toContain('becomes a CSS transition')
    expect([...motion.classNames.values()][0]).toEqual([REVEAL_CLASS])
    expect(gsap.warnings[0]?.code).toBe('unsupported')
    expect(gsap.warnings[0]?.message).toContain('requires GSAP')
  })

  it('warns once per preset, not once per element', () => {
    const tree = element(
      [],
      Array.from({ length: 5 }, () => element([preset('magnetic', 'css', 'hover')])),
    )
    const result = approximateMotion(irWith(tree))

    expect(result.warnings).toHaveLength(1)
    expect(result.classNames.size).toBe(5)
  })

  it('asks for the pointer listener a cursor preset needs, and warns about nothing', () => {
    const result = approximateMotion(irWith(element([preset('spotlight', 'css', 'hover')])))

    expect(result.features).toEqual(new Set(['pointer']))
    expect(result.warnings).toEqual([])
  })
})

describe('approximationRules', () => {
  it('emits nothing when no approximation class is used', () => {
    expect(approximationRules(new Set(['flex', 'px-6']))).toEqual([])
  })

  /**
   * The load-bearing assertion. `.ms-reveal` starts at zero opacity, so a reader who asked for no
   * motion must be given the visible state by the stylesheet — otherwise the page is blank for them.
   */
  it('makes the reveal class visible under reduced motion', () => {
    const rules = approximationRules(new Set([REVEAL_CLASS]))
    const reduced = rules.filter((rule) => rule.media === '(prefers-reduced-motion: reduce)')

    expect(reduced).not.toEqual([])
    expect(reduced.some((rule) => rule.declarations.includes('opacity: 1'))).toBe(true)
    expect(rules[0]?.declarations).toContain('opacity: 0')
  })

  it('emits only the modifiers the document uses', () => {
    const selectors = approximationRules(new Set([REVEAL_CLASS, 'ms-magnetic'])).map(
      (rule) => rule.selector,
    )

    expect(selectors).toContain('.ms-magnetic:hover')
    expect(selectors.some((selector) => selector.includes('ms-reveal-blur'))).toBe(false)
  })
})
