import { describe, expect, it } from 'vitest'

import { buildIR } from '../../ir/build-ir'
import type { IRElement } from '../../ir/ir.types'
import { resolveOptions } from '../../options.types'
import { fixtureRegistry } from '../../test/blocks'
import { GOLDEN_DOCUMENTS } from '../../test/documents'
import { fixturePresets } from '../../test/presets'
import { fixtureTheme } from '../../test/theme'
import type { PrintedTheme } from '../printer.types'

import { HTML_FILE, SCRIPT_BUDGET, printHtml } from './print-html'

/**
 * The whole target, on the fixture landing page — which is the document prompt 44's assertions are
 * stated against. Absence of a theme is `null` rather than `undefined`, so that it survives the
 * default-parameter rule.
 */
function html(name = 'full-landing', overrides = {}, theme: PrintedTheme | null = fixtureTheme()) {
  const options = resolveOptions({ target: 'html', ...overrides })
  const make = GOLDEN_DOCUMENTS[name]

  if (make === undefined) {
    throw new Error(`No fixture document '${name}'`)
  }

  const ir = buildIR({
    document: make(),
    registry: fixtureRegistry(),
    presets: fixturePresets(),
    options,
  })

  return printHtml({ ir, options, ...(theme === null ? {} : { theme }) })
}

const contentsOf = (result: ReturnType<typeof html>): string => result.files[0]?.contents ?? ''

/** The body of the document's own `<script>`, which is the thing the size target is about. */
function scriptOf(source: string): string {
  const marker = ';(() => {'
  const start = source.indexOf(marker)

  return start === -1 ? '' : source.slice(start, source.indexOf('</script>', start))
}

/** The IR the fixture landing page builds, so a test can bend one field of it. */
function irOf() {
  const make = GOLDEN_DOCUMENTS['full-landing']

  return buildIR({
    document:
      make?.() ??
      (() => {
        throw new Error('no fixture')
      })(),
    registry: fixtureRegistry(),
    presets: fixturePresets(),
    options: resolveOptions({ target: 'html' }),
  })
}

/** One element carrying every behavioural hook and one motion preset per script feature. */
function everyFeature(): ReturnType<typeof irOf> {
  const ir = irOf()
  const root: IRElement = {
    kind: 'element',
    tag: 'main',
    classNames: [],
    attributes: {
      'data-ms-color-mode-toggle': { kind: 'literal', value: true },
      'data-ms-disclosure': { kind: 'literal', value: 'single' },
      'data-ms-carousel': { kind: 'literal', value: true },
      'data-ms-menu': { kind: 'literal', value: true },
    },
    children: [],
    motion: [
      { presetId: 'fade-up', engine: 'motion', channel: 'entrance' },
      { presetId: 'spotlight', engine: 'css', channel: 'hover' },
      { presetId: 'sticky-stack', engine: 'css', channel: 'scroll' },
    ],
  }

  return {
    ...ir,
    components: ir.components.map((component) =>
      component.name === ir.entry ? { ...component, root } : component,
    ),
  }
}

describe('printHtml', () => {
  it('writes exactly one file and installs nothing', () => {
    const result = html()

    expect(result.files.map((file) => file.path)).toEqual([HTML_FILE])
    expect(result.dependencies).toEqual({})
  })

  it('opens as a document a browser can parse from the filesystem', () => {
    const source = contentsOf(html())

    expect(source.startsWith('<!doctype html>')).toBe(true)
    expect(source).toContain('<meta charset="utf-8">')
    expect(source).toContain('<meta name="viewport" content="width=device-width, initial-scale=1">')
    expect(source).toContain('<title>Fixture</title>')
  })

  /** No CDN link, no framework, no build step: the promise the whole target is measured against. */
  it('references nothing over the network but the document its own assets name', () => {
    const source = contentsOf(html())
    const remote = [...source.matchAll(/(?:src|href)="(https?:\/\/[^"]+)"/g)].map((hit) => hit[1])

    expect(remote).toEqual(['https://cdn.example.com/studio.png'])
    expect(source).not.toContain('cdn.tailwindcss.com')
    expect(source).not.toContain('fonts.googleapis.com')
  })

  /** Prompt 44: "assert the rule count against `usedClasses`". */
  it('emits a rule for every class the markup printed and no rule for any other', () => {
    const source = contentsOf(html())
    const printed = new Set(
      [...source.matchAll(/class="([^"]+)"/g)].flatMap((hit) => (hit[1] ?? '').split(' ')),
    )
    // A rule's own class is everything up to the next unescaped `.` or `:` — `.ms-reveal.is-visible`
    // is one rule about `ms-reveal`, in a state no element carries in the markup.
    const owner = (selector: string): string =>
      (selector.match(/^(?:\\.|[^.:\\])+/)?.[0] ?? selector).replace(/\\/g, '')
    const selectors = new Set(
      [...source.matchAll(/^\s{6,}\.(\S+?)[ ,]/gm)].map((hit) => owner(hit[1] ?? '')),
    )

    expect(selectors.size).toBeGreaterThan(0)

    for (const selector of selectors) {
      expect(printed.has(selector), `${selector} has a rule but is on no element`).toBe(true)
    }
  })

  it('inlines the theme variables for both modes and the colour-mode script', () => {
    const source = contentsOf(html())

    expect(source).toContain('data-color-mode="dark"')
    expect(source).toContain(":root[data-color-mode='dark']")
    expect(source).toContain('@media (prefers-color-scheme: dark)')
    expect(source).toContain("localStorage.getItem('ms-color-mode')")
  })

  it('reports the script size and stays inside the target for a landing page', () => {
    const bytes = Buffer.byteLength(scriptOf(contentsOf(html())), 'utf8')

    expect(bytes, `full-landing script is ${bytes} bytes`).toBeLessThan(SCRIPT_BUDGET)
    expect(bytes).toBeGreaterThan(0)
  })

  /** With no script the reveal class never clears, so the stylesheet has to do it. */
  it('carries a noscript fallback that makes the hidden elements visible', () => {
    const source = contentsOf(html())

    expect(source).toContain('<noscript>')
    expect(source.slice(source.indexOf('<noscript>'))).toContain('opacity: 1')
  })

  it('emits no script at all for a document with nothing to run', () => {
    const source = contentsOf(html('responsive-overrides'))

    expect(scriptOf(source)).toBe('')
  })

  it('prints a plain img rather than a React component, whatever the option said', () => {
    const source = contentsOf(html('full-landing', { imageComponent: 'next-image' }))

    expect(source).toContain('<img')
    expect(source).not.toContain('<image')
    expect(source).toContain('loading="lazy"')
  })

  it('says nothing about dependencies, because it installs none', () => {
    expect(html().warnings.filter((entry) => entry.code === 'dependency')).toEqual([])
  })

  it('names the missing theme rather than inventing one', () => {
    const result = html('full-landing', {}, null)

    expect(result.warnings.some((entry) => entry.message.includes('no theme stylesheet'))).toBe(
      true,
    )
    expect(contentsOf(result)).not.toContain(':root {')
  })

  it('names the remote images as the one thing that is not self-contained', () => {
    expect(html().warnings.some((entry) => entry.code === 'perf')).toBe(true)
    expect(html('single-hero').warnings.some((entry) => entry.code === 'perf')).toBe(false)
  })

  it('says that assets bundle rewrote paths this target cannot ship', () => {
    const result = html('full-landing', { assets: 'bundle' })

    expect(result.warnings.some((entry) => entry.message.includes('public/'))).toBe(true)
  })

  it('writes no file when the IR names an entry it does not contain', () => {
    const source = html()
    const broken = printHtml({
      ir: { ...irOf(), entry: 'Missing' },
      options: resolveOptions({ target: 'html' }),
    })

    expect(source.files).toHaveLength(1)
    expect(broken.files).toEqual([])
  })

  /**
   * Every behavioural hook at once, which no fixture document produces yet: the script grows past the
   * landing-page target and the report says so with the measured number rather than a shrug.
   */
  it('reports the script size when it goes past the target', () => {
    const result = printHtml({
      ir: everyFeature(),
      options: resolveOptions({ target: 'html' }),
      theme: fixtureTheme(),
    })
    const perf = result.warnings.filter((entry) => entry.code === 'perf')

    expect(perf.some((entry) => entry.message.includes(String(SCRIPT_BUDGET)))).toBe(true)
    expect(perf.some((entry) => /is \d+ bytes/.test(entry.message))).toBe(true)
  })
})
