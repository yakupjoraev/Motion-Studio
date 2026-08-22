import { describe, expect, it } from 'vitest'

import type { MotionDocument } from '@motion-studio/schema'
import { buildIR } from '../../ir/build-ir'
import { type ExportOptions, resolveOptions } from '../../options.types'
import { fixtureRegistry } from '../../test/blocks'
import { document, fullLanding, singleHero } from '../../test/documents'
import { fixturePresets } from '../../test/presets'
import { fixtureTheme } from '../../test/theme'

import { printReact, referencedNames } from './print-react'

const print = (source: MotionDocument, overrides: Partial<ExportOptions> = {}) => {
  const options = resolveOptions({ target: 'react', ...overrides })
  const ir = buildIR({
    document: source,
    registry: fixtureRegistry(),
    presets: fixturePresets(),
    options,
  })

  return { ir, result: printReact({ ir, options, theme: fixtureTheme() }) }
}

const paths = (source: MotionDocument, overrides: Partial<ExportOptions> = {}): readonly string[] =>
  print(source, overrides).result.files.map((file) => file.path)

describe('the file tree', () => {
  it('is one file per component plus a barrel', () => {
    expect(paths(singleHero())).toEqual(['page.tsx', 'hero-section.tsx', 'index.ts', 'theme.css'])
  })

  /** A constant two components reference moves out of both — EXPORT_ENGINE.md § Motion collection. */
  it('writes the shared motion module only once something shares it', () => {
    expect(paths(singleHero())).not.toContain('lib/motion.ts')
    expect(paths(fullLanding())).toContain('lib/motion.ts')
  })

  it('drops the barrel when there is only one component to export', () => {
    expect(paths(singleHero(), { singleFile: true })).toEqual(['page.tsx', 'theme.css'])
  })

  it('names the barrel for the language', () => {
    expect(paths(singleHero(), { language: 'js' })).toContain('index.js')
  })

  it('writes the theme only when the export asked for it', () => {
    expect(paths(fullLanding())).toContain('theme.css')
    expect(paths(fullLanding(), { includeTheme: false })).not.toContain('theme.css')
  })

  it('writes a stylesheet only when the document generated rules', () => {
    expect(paths(fullLanding())).toContain('styles.css')
    expect(paths(singleHero())).not.toContain('styles.css')
  })

  it('writes each runtime module at the path its descriptor declared', () => {
    expect(paths(fullLanding())).toContain('lib/color-mode.ts')
  })
})

describe('the barrel', () => {
  it('lists the entry component first, then the rest in IR order', () => {
    const { result } = print(fullLanding())
    const barrel = result.files.find((file) => file.path === 'index.ts')

    expect(barrel?.contents.split('\n')[0]).toBe("export { Page } from './page'")
    expect(barrel?.contents).toContain("export { PlanCard } from './plan-card'")
  })
})

describe('component references', () => {
  it('finds every component tag in a tree, once each', () => {
    const known = new Set(['Nav', 'PlanCard'])
    const tree = {
      kind: 'element' as const,
      tag: 'main',
      classNames: [],
      attributes: {},
      children: [
        { kind: 'element' as const, tag: 'Nav', classNames: [], attributes: {}, children: [] },
        {
          kind: 'element' as const,
          tag: 'div',
          classNames: [],
          attributes: {},
          children: [
            {
              kind: 'element' as const,
              tag: 'PlanCard',
              classNames: [],
              attributes: {},
              children: [],
            },
            {
              kind: 'element' as const,
              tag: 'PlanCard',
              classNames: [],
              attributes: {},
              children: [],
            },
          ],
        },
      ],
    }

    expect(referencedNames(tree, known)).toEqual(['Nav', 'PlanCard'])
  })

  it('imports each referenced component by a relative specifier', () => {
    const { result } = print(fullLanding())
    const page = result.files.find((file) => file.path === 'page.tsx')

    expect(page?.contents).toContain("import { Nav } from './nav'")
    expect(page?.contents).toContain("import { ThemeToggle } from './theme-toggle'")
  })
})

/**
 * The failure prompt 43 names: one interactive block loose on a page must not make the page a client
 * component. ADR-230 is the rule that makes it reachable, and this is the assertion on the output.
 */
describe('the client boundary in the printed output', () => {
  it('leaves the composing page a Server Component', () => {
    const { result } = print(fullLanding())
    const page = result.files.find((file) => file.path === 'page.tsx')

    expect(page?.contents.startsWith("'use client'")).toBe(false)
    expect(page?.contents).toContain('<ThemeToggle />')
  })

  it('puts the directive on the interactive component instead', () => {
    const { result } = print(fullLanding())
    const toggle = result.files.find((file) => file.path === 'theme-toggle.tsx')

    expect(toggle?.contents.startsWith("'use client'")).toBe(true)
  })

  /** `whenAnyProp` is evaluated, not assumed — the two branches of the same block. */
  it.each([
    { props: { arrows: true }, directive: true },
    { props: {}, directive: false },
  ])('carousel with $props emits the directive: $directive', ({ props, directive }) => {
    const source = document({
      id: 'node_root',
      block: 'page',
      name: 'Page',
      children: [{ id: 'node_carousel', block: 'carousel', name: 'Carousel', props }],
    })
    const { result } = print(source)
    const entry = result.files.find((file) => file.path === 'page.tsx')

    expect(entry?.contents.startsWith("'use client'")).toBe(false)
    expect(result.files.some((file) => file.path === 'carousel.tsx')).toBe(directive)

    if (directive) {
      const carousel = result.files.find((file) => file.path === 'carousel.tsx')

      expect(carousel?.contents.startsWith("'use client'")).toBe(true)
    } else {
      expect(entry?.contents).toContain('<div className="flex snap-x overflow-x-auto" />')
    }
  })
})

describe('the report', () => {
  it('carries the IR warnings unchanged', () => {
    const { ir, result } = print(fullLanding())

    expect(result.warnings).toEqual(ir.warnings)
  })

  it('names the missing stylesheet when the caller asked for a theme and passed none', () => {
    const options = resolveOptions({ target: 'react' })
    const ir = buildIR({
      document: singleHero(),
      registry: fixtureRegistry(),
      presets: fixturePresets(),
      options,
    })
    const result = printReact({ ir, options })

    expect(result.files.some((file) => file.path === 'theme.css')).toBe(false)
    expect(result.warnings.at(-1)?.message).toContain('no theme stylesheet')
  })
})
