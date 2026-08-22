import { describe, expect, it } from 'vitest'

import { MAX_COMPONENT_NAME, fileNameFor, toComponentName, uniqueName } from './name-components'

/**
 * The thirty cases EXPORT_ENGINE.md § Testing asks for. The first seven are its own table verbatim;
 * the rest are the categories the prompt names — reserved words, leading digits, empty names, names
 * that collide after normalisation, unicode, and very long names.
 */
const CASES: readonly (readonly [string, string, string])[] = [
  ['Hero', 'Section 1', 'HeroSection'],
  ['Feature grid', 'Section 1', 'FeatureGrid'],
  ['CTA', 'Section 1', 'CtaSection'],
  ['hero 2', 'Section 1', 'HeroSection2'],
  ['', 'Section 3', 'Section3'],
  ['class', 'Section 1', 'ClassSection'],
  ['1st section', 'Section 1', 'Section1st'],
  ['pricing-table', 'Section 1', 'PricingTable'],
  ['pricing_table', 'Section 1', 'PricingTable'],
  ['PricingTable', 'Section 1', 'PricingTable'],
  ['pricingTable', 'Section 1', 'PricingTable'],
  ['HTTPRequest', 'Section 1', 'HttpRequest'],
  ['  spaced   out  ', 'Section 1', 'SpacedOut'],
  ['Hero!!!', 'Section 1', 'HeroSection'],
  ['Héros', 'Section 1', 'Heros'],
  ['Über menu', 'Section 1', 'UberMenu'],
  ['Привет', 'Section 9', 'Section9'],
  ['日本語', 'Hero 4', 'HeroSection4'],
  ['2024', 'Section 1', 'Section2024'],
  ['404', 'Section 1', 'Section404'],
  ['section', 'Section 1', 'Section'],
  ['Section', 'Section 1', 'Section'],
  ['page', 'Section 1', 'Page'],
  ['main', 'Section 1', 'Main'],
  ['data', 'Section 1', 'DataSection'],
  ['forms', 'Section 1', 'FormsSection'],
  ['a', 'Section 1', 'A'],
  ['function', 'Section 1', 'FunctionSection'],
  ['new', 'Section 1', 'NewSection'],
  ['undefined', 'Section 1', 'UndefinedSection'],
]

describe('toComponentName', () => {
  it.each(CASES)('turns %j into %j', (raw, fallback, expected) => {
    expect(toComponentName(raw, fallback)).toBe(expected)
  })

  it('names all thirty documented cases', () => {
    expect(CASES).toHaveLength(30)
  })

  it('gives the same answer twice for the same input', () => {
    expect(toComponentName('hero 2', 'Section 1')).toBe(toComponentName('hero 2', 'Section 1'))
  })

  it('falls back to the suffix when the name and the fallback are both unwritable', () => {
    expect(toComponentName('', '???')).toBe('Section')
  })

  describe('very long names', () => {
    const long = 'The very long name of a section that keeps on going and going and going'

    it('truncates to the documented ceiling', () => {
      expect(toComponentName(long, 'Section 1')).toHaveLength(MAX_COMPONENT_NAME)
    })

    it('keeps the readable head', () => {
      expect(toComponentName(long, 'Section 1').startsWith('TheVeryLongName')).toBe(true)
    })

    it('separates two names that share their first thirty-six characters', () => {
      const other = `${long} somewhere else`

      expect(toComponentName(long, 'Section 1')).not.toBe(toComponentName(other, 'Section 1'))
    })
  })
})

describe('uniqueName', () => {
  it('leaves a free name alone', () => {
    expect(uniqueName('HeroSection', new Set())).toBe('HeroSection')
  })

  it('counts up from two rather than reaching for the node id', () => {
    expect(uniqueName('HeroSection', new Set(['HeroSection']))).toBe('HeroSection2')
    expect(uniqueName('HeroSection', new Set(['HeroSection', 'HeroSection2']))).toBe('HeroSection3')
  })

  it('keeps the ceiling while it counts', () => {
    const long = 'A'.repeat(MAX_COMPONENT_NAME)

    expect(uniqueName(long, new Set([long]))).toHaveLength(MAX_COMPONENT_NAME)
  })
})

describe('fileNameFor', () => {
  it('is the kebab-case of the component name', () => {
    expect(fileNameFor('HeroSection', 'ts')).toBe('hero-section.tsx')
  })

  it('follows the language into its own extension', () => {
    expect(fileNameFor('HeroSection', 'js')).toBe('hero-section.jsx')
  })
})
