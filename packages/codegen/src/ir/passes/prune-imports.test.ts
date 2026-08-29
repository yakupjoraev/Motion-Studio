import { describe, expect, it } from 'vitest'

import type { IRElement } from '../ir.types'

import { packageOf, pruneDependencies, pruneImports, referencedNames } from './prune-imports'

const element = (overrides: Partial<IRElement> = {}): IRElement => ({
  kind: 'element',
  tag: 'section',
  classNames: [],
  attributes: {},
  children: [],
  ...overrides,
})

const references = (root: IRElement, hooks: readonly string[] = []) =>
  referencedNames({ element: root, hooks, hoisted: [] })

describe('referencedNames', () => {
  it('names the tags of the whole tree', () => {
    const tree = element({ children: [element({ tag: 'Image' })] })

    expect([...references(tree)]).toEqual(expect.arrayContaining(['section', 'Image']))
  })

  it('names the identifiers inside an attribute expression', () => {
    const tree = element({
      attributes: { variants: { kind: 'expression', code: 'fadeUpVariants' } },
    })

    expect(references(tree).has('fadeUpVariants')).toBe(true)
  })

  it('names a hook the component body calls', () => {
    expect(references(element(), ['useGsapParallax(ref)']).has('useGsapParallax')).toBe(true)
  })

  it('names what a hoisted constant refers to', () => {
    const names = referencedNames({
      element: element(),
      hooks: [],
      hoisted: [{ name: 'shine', code: 'const shine = { ease: easeOut }' }],
    })

    expect(names.has('easeOut')).toBe(true)
  })
})

/**
 * ADR-256: the descriptor declares what a hand-written implementation would import, and the markup
 * producer emits elements instead. `import Accordion from '@radix-ui/react-accordion'` is the case
 * that fails to compile — that package has no default export.
 */
describe('pruneImports', () => {
  it('drops a default import the file never names', () => {
    const specs = [{ from: '@radix-ui/react-accordion', default: 'Accordion' }]

    expect(pruneImports(specs, new Set(['section']))).toEqual([])
  })

  it('keeps a default import the file names', () => {
    const specs = [{ from: 'next/image', default: 'Image' }]

    expect(pruneImports(specs, new Set(['Image']))).toEqual(specs)
  })

  it('keeps only the named bindings the file uses', () => {
    const specs = [{ from: 'motion/react', named: ['motion', 'useReducedMotion', 'useScroll'] }]

    expect(pruneImports(specs, new Set(['motion', 'useReducedMotion']))).toEqual([
      { from: 'motion/react', named: ['motion', 'useReducedMotion'] },
    ])
  })

  it('carries the type-only flag through', () => {
    const specs = [{ from: 'react', named: ['CSSProperties'], typeOnly: true }]

    expect(pruneImports(specs, new Set(['CSSProperties']))).toEqual(specs)
  })
})

describe('pruneDependencies', () => {
  it('drops a package nothing imports', () => {
    const dependencies = { '@radix-ui/react-accordion': '^1.2.20', motion: '^11.18.2' }

    expect(pruneDependencies(dependencies, ['motion/react'])).toEqual({ motion: '^11.18.2' })
  })

  it('reads the package out of a scoped subpath', () => {
    expect(packageOf('@radix-ui/react-accordion/dist')).toBe('@radix-ui/react-accordion')
    expect(packageOf('gsap/dist/ScrollTrigger')).toBe('gsap')
  })

  it('has no package for a relative or aliased path', () => {
    expect(packageOf('./lib/motion')).toBeUndefined()
    expect(packageOf('@/lib/motion')).toBeUndefined()
  })
})
