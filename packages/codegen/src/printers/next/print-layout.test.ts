import { describe, expect, it } from 'vitest'

import { toIRTheme } from '../../ir/build-ir'
import type { CodegenIR, IRTheme } from '../../ir/ir.types'
import { resolveOptions } from '../../options.types'
import { FIXTURE_THEME } from '../../test/documents'
import { fixtureTheme } from '../../test/theme'

import { fontPlan } from './fonts'
import { printGlobalsCss } from './print-globals-css'
import { printLayout } from './print-layout'
import { printPackageJson, projectName } from './print-package-json'
import { printReadme } from './print-readme'
import { printTsconfig, tsconfigFileName } from './print-tsconfig'

const irWith = (theme: IRTheme): CodegenIR => ({
  components: [],
  entry: 'Page',
  documentName: 'Landing page',
  theme,
  assets: [],
  stylesheet: { rules: [], keyframes: [] },
  modules: [],
  dependencies: {},
  warnings: [],
})

const base = toIRTheme(FIXTURE_THEME)

const pairing = (id: string): IRTheme => ({
  ...base,
  fontPairing: id,
  config: { ...FIXTURE_THEME, typography: { ...FIXTURE_THEME.typography, pairing: 'geist' } },
})

const layout = (theme: IRTheme = base, withTheme = true): string =>
  printLayout({
    ir: irWith(theme),
    options: resolveOptions({ target: 'next' }),
    ...(withTheme ? { theme: fixtureTheme() } : {}),
  })

describe('fonts', () => {
  it('imports the Google families a pairing has and binds each to its variable', () => {
    const printed = layout()

    expect(printed).toContain("import { Geist, Geist_Mono } from 'next/font/google'")
    expect(printed).toContain("variable: '--ms-font-sans'")
    expect(printed).toContain("variable: '--ms-font-mono'")
    expect(printed).toContain('className={`${geist.variable} ${geistMono.variable} antialiased`}')
  })

  it('imports only what it can fetch, and nothing for a wholly licensed pairing', () => {
    expect(layout(pairing('satoshi-jet'))).toContain(
      "import { JetBrains_Mono } from 'next/font/google'",
    )
    expect(layout(pairing('sohne-berkeley'))).not.toContain('next/font/google')
    expect(layout(pairing('sohne-berkeley'))).toContain('className="antialiased"')
  })

  it('names the families nobody can fetch, so the author finds out', () => {
    expect(fontPlan('sohne-berkeley').unavailable).toEqual(['Söhne', 'Berkeley Mono'])
    expect(fontPlan('geist').unavailable).toEqual([])
  })

  it('falls back to the system plan for a pairing it does not know', () => {
    expect(fontPlan('nonesuch').imports).toEqual([])
  })
})

/** ADR-026: an attribute for a chosen mode, nothing at all for `system`, so the media query decides. */
describe('the colour mode', () => {
  it('stamps the document with the theme mode', () => {
    expect(layout()).toContain('<html lang="en" data-color-mode="dark" suppressHydrationWarning>')
  })

  it('stamps nothing when the theme follows the system', () => {
    expect(layout({ ...base, colorMode: 'system' })).toContain('<html lang="en" suppressHydration')
  })

  it('inlines the script in the head, before first paint', () => {
    const printed = layout()

    expect(printed).toContain('<head>')
    expect(printed).toContain('<script dangerouslySetInnerHTML={{ __html: colorMode }} />')
    expect(printed).toContain("localStorage.getItem('ms-color-mode')")
  })

  it('writes no head and no hydration suppression when there is no script to run', () => {
    const printed = layout(base, false)

    expect(printed).not.toContain('<head>')
    expect(printed).not.toContain('suppressHydrationWarning')
  })
})

describe('metadata', () => {
  it('titles the page with the document the user named', () => {
    expect(layout()).toContain("title: 'Landing page',")
    expect(layout()).toContain('export const metadata: Metadata = {')
  })

  it('drops the type annotation in a JavaScript export', () => {
    const printed = printLayout({
      ir: irWith(base),
      options: resolveOptions({ target: 'next', language: 'js' }),
      theme: fixtureTheme(),
    })

    expect(printed).toContain('export const metadata = {')
    expect(printed).not.toContain("from 'next'")
  })
})

describe('globals.css', () => {
  it('leads with Tailwind, then the theme, then the font alias', () => {
    const printed = printGlobalsCss({ ir: irWith(base), theme: fixtureTheme() })
    const order = ["@import 'tailwindcss';", ':root {', 'body {'].map((needle) =>
      printed.indexOf(needle),
    )

    expect(order).toEqual([...order].sort((left, right) => left - right))
    expect(printed).toContain('  --ms-font-display: var(--ms-font-sans);')
  })

  it('carries no theme block when none was passed, but still wires the fonts', () => {
    const printed = printGlobalsCss({ ir: irWith(base) })

    expect(printed).not.toContain(':root {')
    expect(printed).toBe(
      "@import 'tailwindcss';\n\nbody {\n  --ms-font-display: var(--ms-font-sans);\n}\n",
    )
  })

  it('writes no font alias for a pairing that imports nothing', () => {
    const printed = printGlobalsCss({
      ir: irWith(pairing('sohne-berkeley')),
      theme: fixtureTheme(),
    })

    expect(printed).not.toContain('--ms-font-display: var')
  })

  it('appends the rules the document generated', () => {
    const ir = irWith(base)
    const printed = printGlobalsCss({
      ir: {
        ...ir,
        stylesheet: {
          rules: [{ selector: '.v-tint', declarations: ['background-color: var(--ms-tint)'] }],
          keyframes: [],
        },
      },
      theme: fixtureTheme(),
    })

    expect(printed).toContain('.v-tint {\n  background-color: var(--ms-tint);\n}')
  })
})

describe('package.json', () => {
  it('kebabs the document name and falls back when there is none', () => {
    expect(projectName('Landing page')).toBe('landing-page')
    expect(projectName('')).toBe('motion-export')
  })

  it('carries the accumulated dependencies beside the framework', () => {
    const ir = { ...irWith(base), dependencies: { motion: '^11.18.2' } }
    const manifest: unknown = JSON.parse(printPackageJson(ir, resolveOptions({ target: 'next' })))

    expect(manifest).toMatchObject({
      name: 'landing-page',
      scripts: { dev: 'next dev', build: 'next build', start: 'next start' },
      dependencies: { motion: '^11.18.2', next: '^15.5.4' },
    })
  })

  it('drops the TypeScript tooling from a JavaScript export', () => {
    const printed = printPackageJson(
      irWith(base),
      resolveOptions({ target: 'next', language: 'js' }),
    )

    expect(printed).not.toContain('@types/react')
    expect(printed).toContain('tailwindcss')
  })

  it('keeps a short array on one line, the way Prettier writes JSON', () => {
    expect(printTsconfig(resolveOptions({ target: 'next' }))).toContain(
      '"lib": ["dom", "dom.iterable", "esnext"]',
    )
  })
})

describe('tsconfig', () => {
  it('declares the alias every printed import uses', () => {
    expect(printTsconfig(resolveOptions({ target: 'next' }))).toContain('"@/*": ["./*"]')
    expect(tsconfigFileName(resolveOptions({ target: 'next' }))).toBe('tsconfig.json')
  })

  it('becomes a jsconfig carrying only the alias for a JavaScript export', () => {
    const options = resolveOptions({ target: 'next', language: 'js' })

    expect(tsconfigFileName(options)).toBe('jsconfig.json')
    expect(printTsconfig(options)).toBe(
      '{\n  "compilerOptions": {\n    "paths": {\n      "@/*": ["./*"]\n    }\n  }\n}\n',
    )
  })
})

describe('README', () => {
  it('says what the project is and the two commands that run it', () => {
    const printed = printReadme(irWith(base), resolveOptions({ target: 'next' }))

    expect(printed.startsWith('# Landing page')).toBe(true)
    expect(printed).toContain('npm install')
    expect(printed).toContain('npm run dev')
    expect(printed).toContain('`app/page.tsx`')
  })

  it('tells the reader which font files they have to supply', () => {
    const printed = printReadme(
      irWith(pairing('sohne-berkeley')),
      resolveOptions({ target: 'next' }),
    )

    expect(printed).toContain('## Fonts')
    expect(printed).toContain('Söhne and Berkeley Mono are licensed')
  })

  it('describes the page differently when there is nothing beside it', () => {
    const printed = printReadme(irWith(base), resolveOptions({ target: 'next' }))

    expect(printed).toContain('| `app/page.tsx` | The whole document, in one component |')
    expect(printed).not.toContain('| `components/` |')
  })

  it('says nothing about fonts when every family loads', () => {
    expect(printReadme(irWith(base), resolveOptions({ target: 'next' }))).not.toContain('## Fonts')
  })

  it('agrees with itself grammatically when only one family is missing', () => {
    const printed = printReadme(irWith(pairing('satoshi-jet')), resolveOptions({ target: 'next' }))

    expect(printed).toContain('Satoshi is licensed')
  })
})
