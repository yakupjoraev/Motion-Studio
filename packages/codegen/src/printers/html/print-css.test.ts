import { describe, expect, it } from 'vitest'

import { FIXTURE_THEME_CSS } from '../../test/theme'

import { printCss, utilitySheet } from './print-css'

const NONE = new Set<string>()

describe('utilitySheet', () => {
  it('emits one rule per used class and nothing else', () => {
    const sheet = utilitySheet(new Set(['flex', 'px-6', 'text-center']), NONE)

    expect(sheet.count).toBe(3)
    expect(sheet.rules.map((rule) => rule.selector)).toEqual(['.flex', '.px-6', '.text-center'])
    expect(sheet.warnings).toEqual([])
  })

  /** Base first, then each breakpoint ascending: the order Tailwind resolves conflicts in. */
  it('orders base rules before breakpoint rules, and breakpoints by width', () => {
    const sheet = utilitySheet(new Set(['lg:px-8', 'px-6', 'sm:px-4']), NONE)

    expect(sheet.rules.map((rule) => rule.selector)).toEqual(['.px-6', '.sm\\:px-4', '.lg\\:px-8'])
    expect(sheet.rules[2]?.media).toBe('(min-width: 1024px)')
  })

  it('escapes the characters a class name carries and a selector cannot', () => {
    const sheet = utilitySheet(new Set(['grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]']), NONE)

    expect(sheet.rules[0]?.selector).toBe(
      '.grid-cols-\\[repeat\\(auto-fit\\,minmax\\(16rem\\,1fr\\)\\)\\]',
    )
  })

  it('turns a known variant into a pseudo-class', () => {
    const sheet = utilitySheet(new Set(['hover:bg-accent', 'first:pt-0']), NONE)
    const selectors = sheet.rules.map((rule) => rule.selector)

    expect(selectors).toContain('.hover\\:bg-accent:hover')
    expect(selectors).toContain('.first\\:pt-0:first-child')
  })

  it('skips a class the IR stylesheet already covers', () => {
    const sheet = utilitySheet(new Set(['ms-shine', 'flex']), new Set(['ms-shine']))

    expect(sheet.count).toBe(1)
    expect(sheet.warnings).toEqual([])
  })

  it('names the classes it cannot translate rather than inventing a rule', () => {
    const sheet = utilitySheet(new Set(['flex', 'sparkle-9', 'group-hover:opacity-100']), NONE)

    expect(sheet.count).toBe(1)
    expect(sheet.warnings).toHaveLength(1)
    expect(sheet.warnings[0]?.message).toContain('sparkle-9')
    expect(sheet.warnings[0]?.message).toContain('group-hover:opacity-100')
  })
})

describe('printCss', () => {
  const base = {
    assets: 'reference',
    utilities: [{ selector: '.flex', declarations: ['display: flex'] }],
    approximations: [],
    stylesheet: { rules: [], keyframes: [] },
  }

  it('puts the reset first and the theme after it, because CSS is order-dependent', () => {
    const css = printCss({ ...base, themeCss: FIXTURE_THEME_CSS })

    expect(css.indexOf('box-sizing: border-box')).toBeLessThan(css.indexOf(':root {'))
    expect(css.indexOf(':root {')).toBeLessThan(css.indexOf('.flex'))
  })

  it('states which font mode produced the sheet, as prompt 44 requires', () => {
    expect(printCss({ ...base, assets: 'inline' })).toContain("mode 'inline'")
    expect(printCss(base)).toContain('@font-face')
    expect(printCss(base)).toContain('uncomment')
  })

  it('omits the theme section entirely when there is no theme', () => {
    expect(printCss(base)).not.toContain(':root {')
  })

  it('writes the keyframes the presets produced', () => {
    const css = printCss({
      ...base,
      stylesheet: { rules: [], keyframes: ['@keyframes ms-shine {\n  to { opacity: 1; }\n}'] },
    })

    expect(css).toContain('@keyframes ms-shine')
  })
})
