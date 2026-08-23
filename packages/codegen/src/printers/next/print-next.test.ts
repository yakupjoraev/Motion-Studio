import type { MotionDocument } from '@motion-studio/schema'
import { describe, expect, it } from 'vitest'

import { buildIR } from '../../ir/build-ir'
import { type ExportOptions, resolveOptions } from '../../options.types'
import { fixtureRegistry } from '../../test/blocks'
import { document, fullLanding, singleHero } from '../../test/documents'
import { fixtureMarkup } from '../../test/markup'
import { fixturePresets } from '../../test/presets'
import { fixtureTheme } from '../../test/theme'

import { printNext } from './print-next'
import { MISSING_ENTRY, printPage } from './print-page'

const print = (source: MotionDocument, overrides: Partial<ExportOptions> = {}) => {
  const options = resolveOptions({ target: 'next', ...overrides })
  const ir = buildIR({
    document: source,
    registry: fixtureRegistry(),
    markup: fixtureMarkup,
    presets: fixturePresets(),
    options,
  })

  return printNext({ ir, options, theme: fixtureTheme() })
}

const paths = (source: MotionDocument, overrides: Partial<ExportOptions> = {}): readonly string[] =>
  print(source, overrides).files.map((file) => file.path)

const fileIn = (source: MotionDocument, path: string, overrides: Partial<ExportOptions> = {}) =>
  print(source, overrides).files.find((file) => file.path === path)?.contents ?? ''

describe('the project tree', () => {
  it('is EXPORT_ENGINE.md § Next.js, plus the PostCSS config Tailwind v4 needs to run', () => {
    expect(paths(singleHero())).toEqual([
      'app/layout.tsx',
      'app/page.tsx',
      'app/globals.css',
      'components/hero-section.tsx',
      'package.json',
      'postcss.config.mjs',
      'tsconfig.json',
      'README.md',
    ])
  })

  it('puts every component but the entry under components/', () => {
    const tree = paths(fullLanding())

    expect(tree).toContain('components/plan-card.tsx')
    expect(tree).not.toContain('components/page.tsx')
  })

  it('collapses to one page under singleFile', () => {
    expect(
      paths(fullLanding(), { singleFile: true }).filter((path) => path.startsWith('components/')),
    ).toEqual([])
  })

  it('renames the app files and the config for a JavaScript export', () => {
    const tree = paths(singleHero(), { language: 'js' })

    expect(tree).toContain('app/page.jsx')
    expect(tree).toContain('jsconfig.json')
    expect(tree).not.toContain('tsconfig.json')
  })

  it('writes the runtime modules at their declared paths', () => {
    expect(paths(fullLanding())).toContain('lib/color-mode.ts')
    expect(paths(fullLanding())).toContain('lib/motion.ts')
  })
})

/**
 * "Getting this wrong means a fully client-rendered page, which defeats the point of the Next export."
 * The whole prompt turns on this assertion.
 */
describe('the page', () => {
  it('is a default export, which is what Next requires', () => {
    expect(fileIn(singleHero(), 'app/page.tsx')).toContain('export default function Page() {')
  })

  it('is not a client component even though it composes four of them', () => {
    const page = fileIn(fullLanding(), 'app/page.tsx')

    expect(page.startsWith("'use client'")).toBe(false)
    expect(page).toContain('<Nav />')
    expect(page).toContain('<ThemeToggle />')
    expect(fileIn(fullLanding(), 'components/nav.tsx').startsWith("'use client'")).toBe(true)
    expect(fileIn(fullLanding(), 'components/theme-toggle.tsx').startsWith("'use client'")).toBe(
      true,
    )
  })

  it('imports its sections through the alias the tsconfig declares', () => {
    expect(fileIn(fullLanding(), 'app/page.tsx')).toContain(
      "import { HeroSection } from '@/components/hero-section'",
    )
  })

  it('is boring: one line per section inside the root element', () => {
    const page = fileIn(fullLanding(), 'app/page.tsx')
    const composed = page.slice(page.indexOf('<main'), page.indexOf('</main>'))

    expect(composed).toContain('      <Nav />\n      <HeroSection />\n      <Pricing />\n')
  })

  /** A single interactive block still costs the page nothing — ADR-230, at the printed-output level. */
  it.each([
    { props: { dots: true }, client: true },
    { props: {}, client: false },
  ])('carousel with $props becomes its own file: $client', ({ props, client }) => {
    const source = document({
      id: 'node_root',
      block: 'page',
      name: 'Page',
      children: [{ id: 'node_carousel', block: 'carousel', name: 'Carousel', props }],
    })

    expect(fileIn(source, 'app/page.tsx').startsWith("'use client'")).toBe(false)
    expect(paths(source).includes('components/carousel.tsx')).toBe(client)
  })
})

/**
 * An IR whose entry names no component is a defect in `buildIR`, and a Next project with no `page.tsx`
 * would look like a printer that decided not to bother. It says which name it could not find instead.
 */
describe('a broken entry', () => {
  it('throws rather than emitting a project without a page', () => {
    const options = resolveOptions({ target: 'next' })
    const ir = buildIR({
      document: singleHero(),
      registry: fixtureRegistry(),
      markup: fixtureMarkup,
      presets: fixturePresets(),
      options,
    })

    expect(() => printPage({ ...ir, entry: 'Nowhere' }, options)).toThrowError(/Nowhere/)
    expect(MISSING_ENTRY).toBe('MISSING_ENTRY_COMPONENT')
  })
})

describe('the report', () => {
  it('always declares the framework, on top of what the document accumulated', () => {
    const result = print(fullLanding())

    expect(result.dependencies['next']).toBe('^15.5.4')
    expect(result.dependencies['react']).toBe('^19.1.1')
    expect(result.dependencies['motion']).toBe('^11.18.2')
  })

  it('says so when a font family cannot be fetched at build time', () => {
    const source = fullLanding()
    const licensed: MotionDocument = {
      ...source,
      theme: {
        ...source.theme,
        typography: { ...source.theme.typography, pairing: 'sohne-berkeley' },
      },
    }
    const messages = print(licensed).warnings.map((entry) => entry.message)

    expect(messages.some((message) => message.includes('Söhne and Berkeley Mono'))).toBe(true)
  })

  it('agrees with itself grammatically when one family is missing', () => {
    const source = fullLanding()
    const licensed: MotionDocument = {
      ...source,
      theme: {
        ...source.theme,
        typography: { ...source.theme.typography, pairing: 'satoshi-jet' },
      },
    }
    const messages = print(licensed).warnings.map((entry) => entry.message)

    expect(messages.some((message) => message.startsWith('Satoshi cannot be fetched'))).toBe(true)
  })

  it('says so when the caller asked for a theme and passed none', () => {
    const options = resolveOptions({ target: 'next' })
    const ir = buildIR({
      document: singleHero(),
      registry: fixtureRegistry(),
      markup: fixtureMarkup,
      presets: fixturePresets(),
      options,
    })

    expect(printNext({ ir, options }).warnings.at(-1)?.message).toContain('globals.css')
  })
})
