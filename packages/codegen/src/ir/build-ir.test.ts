import { type MotionDocument, nodeId } from '@motion-studio/schema'
import { describe, expect, it } from 'vitest'

import type { ExportOptions } from '../options.types'
import { fixtureRegistry } from '../test/blocks'
import { document, eightFadeUp, fullLanding, singleHero } from '../test/documents'
import { fixturePresets } from '../test/presets'
import { CODEGEN_ERROR_CODES, MOTION_MODULE_PATH, buildIR } from './build-ir'
import type { CodegenIR, IRChild, IRElement } from './ir.types'

const build = (
  source: MotionDocument,
  options: Partial<ExportOptions> = {},
  selection?: string,
): CodegenIR =>
  buildIR({
    document: source,
    registry: fixtureRegistry(),
    presets: fixturePresets(),
    options,
    ...(selection === undefined ? {} : { selection: nodeId(selection) }),
  })

const names = (ir: CodegenIR): readonly string[] => ir.components.map((entry) => entry.name)

const component = (ir: CodegenIR, name: string) =>
  ir.components.find((entry) => entry.name === name)

const find = (element: IRElement, tag: string): IRElement | undefined => {
  if (element.tag === tag) {
    return element
  }

  for (const child of element.children as readonly IRChild[]) {
    if (child.kind === 'element') {
      const found = find(child, tag)

      if (found !== undefined) {
        return found
      }
    }
  }

  return undefined
}

describe('the IR of the full-landing fixture', () => {
  const ir = build(fullLanding())

  it('names the entry after the document root', () => {
    expect(ir.entry).toBe('Page')
  })

  it('has one component per boundary, in document order', () => {
    expect(names(ir)).toEqual(['Page', 'Nav', 'HeroSection', 'Pricing', 'ThemeToggle', 'PlanCard'])
  })

  it('files them by the kebab-case of their names', () => {
    expect(ir.components.map((entry) => entry.fileName)).toEqual([
      'page.tsx',
      'nav.tsx',
      'hero-section.tsx',
      'pricing.tsx',
      'theme-toggle.tsx',
      'plan-card.tsx',
    ])
  })

  it('accumulates the dependencies its output actually needs', () => {
    expect(ir.dependencies).toEqual({ motion: '^11.18.2' })
  })

  it('leaves the page a Server Component and puts the directive where it belongs', () => {
    expect(component(ir, 'Page')?.client.emit).toBe(false)
    expect(component(ir, 'ThemeToggle')?.client).toEqual({
      emit: true,
      reason: 'It writes the colour mode.',
    })
    expect(component(ir, 'HeroSection')?.client.emit).toBe(true)
    expect(component(ir, 'PlanCard')?.client.emit).toBe(false)
  })

  it('writes the runtime module a block asked for beside the components', () => {
    expect(ir.modules.map((entry) => entry.path)).toEqual(['lib/color-mode.ts', MOTION_MODULE_PATH])
  })

  it('turns three cards into one component with the props they differ in', () => {
    expect(component(ir, 'PlanCard')?.props).toEqual([
      { name: 'plan', type: 'string', defaultValue: { kind: 'literal', value: 'Starter' } },
      { name: 'price', type: 'number', defaultValue: { kind: 'literal', value: 0 } },
    ])
  })

  it('keys the three usages, because they are a list', () => {
    const pricing = component(ir, 'Pricing')?.root.children ?? []

    expect(pricing.map((child) => (child.kind === 'element' ? child.key : undefined))).toEqual([
      'node_plan1',
      'node_plan2',
      'node_plan3',
    ])
  })

  it('carries the descriptor notes and the structured data the props enabled', () => {
    const faq = find(component(ir, 'Page')?.root as IRElement, 'section')

    expect(component(ir, 'Page')?.root.children.some((child) => child.kind === 'element')).toBe(
      true,
    )
    expect(faq?.notes ?? []).toEqual([])
    expect(JSON.stringify(component(ir, 'Page')?.root).includes('"structuredData":"FAQPage"')).toBe(
      true,
    )
  })

  it('collects the stylesheet passes 3 and 4 produced', () => {
    expect(ir.stylesheet.rules).toEqual([
      {
        selector: '.v-section-tint',
        declarations: ['background-color: var(--ms-section-tint)'],
      },
      {
        selector: '.ms-shine',
        declarations: ['animation: none', 'transition: none'],
        media: '(prefers-reduced-motion: reduce)',
      },
    ])
    expect(ir.stylesheet.keyframes).toHaveLength(1)
  })

  it('finds the one image and describes it', () => {
    expect(ir.assets).toHaveLength(1)
    expect(ir.assets[0]?.alt).toBe('The studio canvas')
  })

  it('names the props that reach neither a class nor an attribute — ADR-229', () => {
    const unreached = ir.warnings.filter((entry) => entry.code === 'unsupported')

    expect(unreached.map((entry) => entry.nodeId)).toEqual([
      'node_faq',
      'node_nav',
      'node_hero',
      'node_plan1',
    ])
  })
})

describe('stability', () => {
  it('gives the same names on two runs of the same document', () => {
    expect(names(build(fullLanding()))).toEqual(names(build(fullLanding())))
  })

  it('gives the same IR on two runs of the same document', () => {
    expect(JSON.stringify(build(fullLanding()))).toBe(JSON.stringify(build(fullLanding())))
  })

  it('numbers a collision rather than reaching for the node id', () => {
    const twins = document({
      id: 'node_root',
      block: 'page',
      children: [
        { id: 'node_a', block: 'hero', name: 'Hero', props: { padding: 'md' } },
        { id: 'node_b', block: 'hero', name: 'Hero', props: { padding: 'lg' } },
      ],
    })

    expect(names(build(twins))).toEqual(['Page', 'HeroSection', 'HeroSection2'])
  })
})

describe('motion hoisting across components', () => {
  const ir = build(eightFadeUp())

  it('emits one constant for eight sections and shares it through a module', () => {
    const shared = ir.modules.find((entry) => entry.path === MOTION_MODULE_PATH)

    expect(shared?.named).toEqual(['fadeUpTransition', 'fadeUpVariants'])
    expect(shared?.source.match(/export const/g)).toHaveLength(2)
  })

  it('leaves no component holding a private copy', () => {
    expect(ir.components.flatMap((entry) => entry.hoisted)).toEqual([])
  })

  it('has every band import the shared names', () => {
    const band = component(ir, 'Band1')

    expect(band?.imports).toEqual([
      { from: 'motion/react', named: ['motion', 'useReducedMotion'] },
      { from: './lib/motion', named: ['fadeUpTransition', 'fadeUpVariants'] },
    ])
  })

  it('points at the project alias when the target is a Next project', () => {
    const next = build(eightFadeUp(), { target: 'next' })

    expect(component(next, 'Band1')?.imports[1]?.from).toBe('@/lib/motion')
  })

  it('keeps a constant only one component uses inside that component', () => {
    const ir2 = build(singleHero())

    expect(component(ir2, 'HeroSection')?.hoisted.map((entry) => entry.name)).toEqual([
      'fadeUpTransition',
      'fadeUpVariants',
    ])
    expect(ir2.modules).toEqual([])
  })
})

describe('the options', () => {
  it('collapses the whole document into the entry under singleFile', () => {
    const ir = build(fullLanding(), { singleFile: true })

    expect(names(ir)).toEqual(['Page'])
    expect(ir.components[0]?.client.emit).toBe(true)
  })

  it('follows the language into the file names', () => {
    expect(build(singleHero(), { language: 'js' }).components[0]?.fileName).toBe('page.jsx')
  })

  it('exports one subtree under scope selection', () => {
    const ir = build(fullLanding(), { scope: 'selection' }, 'node_pricing')

    expect(ir.entry).toBe('Pricing')
    expect(names(ir)).toEqual(['Pricing', 'PlanCard'])
  })

  it('refuses a selection scope with no node rather than exporting the document', () => {
    expect(() => build(fullLanding(), { scope: 'selection' })).toThrowError(
      /needs a node that is in the document/,
    )
  })
})

describe('a block that does not declare its client boundary', () => {
  const withUndeclared = () =>
    build(
      document({
        id: 'node_root',
        block: 'page',
        children: [{ id: 'node_x', block: 'undeclared' }],
      }),
    )

  it('stops the export instead of guessing', () => {
    expect(withUndeclared).toThrowError(/No client boundary declared by undeclared/)
  })

  it('carries the code a caller discriminates on', () => {
    try {
      withUndeclared()
      expect.unreachable('buildIR should have thrown')
    } catch (error) {
      expect((error as { code: string }).code).toBe(CODEGEN_ERROR_CODES.undeclaredClient)
    }
  })
})
