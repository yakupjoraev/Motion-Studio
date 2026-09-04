import { type MotionDocument, nodeId } from '@motion-studio/schema'
import { describe, expect, it } from 'vitest'

import type { ExportOptions } from '../options.types'
import { fixtureRegistry } from '../test/blocks'
import { document, eightFadeUp, fullLanding, singleHero } from '../test/documents'
import { fixtureMarkup } from '../test/markup'
import { fixturePresets, spec } from '../test/presets'
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
    markup: fixtureMarkup,
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

  /**
   * ADR-234, which supersedes the keys this used to assert. Three siblings written out in JSX are not
   * a mapped array, and the only value available was the node id — the first editor artifact
   * EXPORT_ENGINE.md § React's rule table bans from generated output.
   */
  it('keys none of the three usages, and carries no node id into the output', () => {
    const pricing = component(ir, 'Pricing')?.root.children ?? []

    expect(pricing.map((child) => (child.kind === 'element' ? child.key : undefined))).toEqual([
      undefined,
      undefined,
      undefined,
    ])
    expect(JSON.stringify(component(ir, 'Pricing'))).not.toContain('node_plan')
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
    // The tint is inline on the element that carries it: a declaration only reaches the stylesheet
    // when a breakpoint overrides it and a media query has to hold the override — ADR-252.
    expect(ir.stylesheet.rules).toEqual([
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

  it('has nothing left to report as unreached — ADR-229 closes with ADR-252', () => {
    // The warning existed because a descriptor named the props that reached a class and left the rest
    // unaccounted for. A producer reads whichever props it likes and prints them, so there is no
    // second list to be short against, and the count on this fixture is the report.
    expect(ir.warnings.filter((entry) => entry.code === 'unsupported')).toEqual([])
  })
})

/**
 * ADR-257. The descriptor's element-level extras — the passthrough props, and the tag and attributes
 * the asset collector decides — belong to the element the descriptor names. When the producer's root
 * is a different element, repeating them on the wrapper prints `src` on a `<figure>`.
 */
describe('a producer that frames the element its descriptor names', () => {
  const framed = build(
    document({
      id: 'node_root',
      block: 'page',
      children: [{ id: 'node_image', block: 'framed-image', name: 'Framed' }],
    }),
  )
  const root = component(framed, 'Page')?.root as IRElement
  const figure = find(root, 'figure')

  it('leaves the passthrough props off the wrapper', () => {
    expect(Object.keys(figure?.attributes ?? {})).toEqual([])
  })

  it('keeps the attributes the producer put on the element itself', () => {
    expect(find(root, 'img')?.attributes['src']).toEqual({ kind: 'literal', value: '/framed.png' })
  })
})

/**
 * ADR-259. A fragment may hoist a statement rather than a declaration, and a statement declares
 * nothing: the shared module would have printed `export document.documentElement...`.
 */
describe('a hoisted statement', () => {
  const statement = spec('scroll-parallax')
  const withStatement = build(
    document({
      id: 'node_root',
      block: 'page',
      children: [
        { id: 'node_a', block: 'hero', name: 'One', motion: { entrance: statement } },
        { id: 'node_b', block: 'section', name: 'Two', motion: { entrance: statement } },
      ],
    }),
  )

  it('stays out of the shared module however many components need it', () => {
    expect(withStatement.modules.map((module) => module.path)).not.toContain(MOTION_MODULE_PATH)
  })

  it('is written into every component that needs it', () => {
    const codes = withStatement.components.flatMap((entry) =>
      entry.hoisted.map((constant) => constant.code),
    )

    expect(
      codes.filter((code) => code === "document.documentElement.dataset.msScroll = 'on'"),
    ).toHaveLength(2)
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

describe('the css escape hatch', () => {
  const withCss = (css: string): CodegenIR =>
    build(
      document({
        id: 'node_root',
        block: 'page',
        name: 'Page',
        children: [{ id: 'node_hero', block: 'hero', name: 'Hero', props: { css } }],
      }),
    )

  const hero = (ir: CodegenIR): IRElement | undefined => {
    for (const entry of ir.components) {
      const found = find(entry.root, 'section')

      if (found !== undefined) {
        return found
      }
    }

    return undefined
  }

  it('reaches the node’s root element as an inline style — ADR-274', () => {
    expect(hero(withCss('box-shadow: 0 8px 24px black'))?.cssVars).toEqual({
      boxShadow: '0 8px 24px black',
    })
  })

  it('carries every declaration the block accepts', () => {
    expect(hero(withCss('box-shadow: none;\nclip-path: circle(40%)'))?.cssVars).toEqual({
      boxShadow: 'none',
      clipPath: 'circle(40%)',
    })
  })

  it('leaves out a property that is not in the escape hatch', () => {
    expect(hero(withCss('display: none;\nbox-shadow: none'))?.cssVars).toEqual({
      boxShadow: 'none',
    })
  })

  it('adds nothing to a node that has no escape hatch', () => {
    expect(hero(build(singleHero()))?.cssVars).toBeUndefined()
  })
})
