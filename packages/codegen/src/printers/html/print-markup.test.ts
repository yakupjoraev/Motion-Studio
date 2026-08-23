import { describe, expect, it } from 'vitest'

import type { IRElement, IRValue } from '../../ir/ir.types'
import type { IRWarning } from '../../warnings'

import { type MarkupContext, printMarkup } from './print-markup'
import type { ScriptFeature } from './print-scripts'

const context = (extra: ReadonlyMap<IRElement, readonly string[]> = new Map()): MarkupContext => ({
  extraClasses: extra,
  warnings: [] as IRWarning[],
  usedClasses: new Set<string>(),
  features: new Set<ScriptFeature>(),
})

const element = (overrides: Partial<IRElement> = {}): IRElement => ({
  kind: 'element',
  tag: 'div',
  classNames: [],
  attributes: {},
  children: [],
  ...overrides,
})

const expression = (code: string): IRValue => ({ kind: 'expression', code })

describe('printMarkup', () => {
  it('drops the motion. prefix, because the element under it is a section', () => {
    expect(printMarkup(element({ tag: 'motion.section' }), context())).toBe('<section></section>')
  })

  it('closes a void element without a closing tag', () => {
    const source = printMarkup(
      element({ tag: 'img', attributes: { src: { kind: 'literal', value: 'a.png' } } }),
      context(),
    )

    expect(source).toBe('<img src="a.png">')
  })

  /** A literal Motion prop would otherwise survive the attribute filter and validate as nonsense. */
  it('drops a Motion prop in silence, whether it is a literal or an expression', () => {
    const marked = context()
    const source = printMarkup(
      element({
        tag: 'motion.div',
        attributes: {
          whileInView: { kind: 'literal', value: 'visible' },
          transition: expression('fadeUpTransition'),
        },
      }),
      marked,
    )

    expect(source).toBe('<div></div>')
    expect(marked.warnings).toEqual([])
  })

  it('reports an attribute that is neither HTML nor Motion', () => {
    const marked = context()

    printMarkup(element({ attributes: { sparkle: { kind: 'literal', value: 'yes' } } }), marked)

    expect(marked.warnings).toHaveLength(1)
    expect(marked.warnings[0]?.message).toContain("drops 'sparkle'")
  })

  it('keeps data and aria attributes, and notices the behaviour they ask for', () => {
    const marked = context()
    const source = printMarkup(
      element({
        attributes: {
          'data-ms-disclosure': { kind: 'literal', value: 'single' },
          'aria-label': { kind: 'literal', value: 'Questions' },
        },
      }),
      marked,
    )

    expect(source).toContain('data-ms-disclosure="single"')
    expect(source).toContain('aria-label="Questions"')
    expect(marked.features).toEqual(new Set(['disclosure']))
  })

  /**
   * An icon reaches the HTML target as a real `<svg>` — ADR-250. Before it did, every one of these
   * attributes was reported as unsupported and the glyph printed as an empty tag.
   */
  it('prints an inline svg, hyphenating the stroke contract on the way out', () => {
    const marked = context()
    const source = printMarkup(
      element({
        tag: 'svg',
        attributes: {
          'aria-hidden': { kind: 'literal', value: true },
          width: { kind: 'literal', value: 16 },
          viewBox: { kind: 'literal', value: '0 0 20 20' },
          fill: { kind: 'literal', value: 'none' },
          stroke: { kind: 'literal', value: 'currentColor' },
          strokeWidth: { kind: 'literal', value: 1.5 },
          strokeLinecap: { kind: 'literal', value: 'round' },
          focusable: { kind: 'literal', value: 'false' },
        },
        children: [
          element({
            tag: 'path',
            attributes: {
              d: { kind: 'literal', value: 'M10 4v12M4 10h12' },
              strokeDasharray: { kind: 'literal', value: '1.6 2' },
            },
          }),
          element({
            tag: 'circle',
            attributes: {
              cx: { kind: 'literal', value: 10 },
              cy: { kind: 'literal', value: 10 },
              r: { kind: 'literal', value: 7 },
            },
          }),
        ],
      }),
      marked,
    )

    expect(source).toContain(
      '<svg aria-hidden="true" width="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" focusable="false">',
    )
    expect(source).toContain('<path d="M10 4v12M4 10h12" stroke-dasharray="1.6 2"></path>')
    expect(source).toContain('<circle cx="10" cy="10" r="7"></circle>')
    expect(marked.warnings).toEqual([])
  })

  it('renames the React spellings HTML gives another word to', () => {
    const source = printMarkup(
      element({ tag: 'label', attributes: { htmlFor: { kind: 'literal', value: 'name' } } }),
      context(),
    )

    expect(source).toContain('for="name"')
  })

  it('writes a boolean attribute as its name, and false as nothing', () => {
    const source = printMarkup(
      element({
        tag: 'details',
        attributes: {
          open: { kind: 'literal', value: true },
          hidden: { kind: 'literal', value: false },
        },
      }),
      context(),
    )

    expect(source).toBe('<details open></details>')
  })

  /** Presence is a value only for a real boolean attribute; an ARIA state is a word. */
  it('spells an ARIA boolean out rather than omitting it', () => {
    const source = printMarkup(
      element({
        tag: 'button',
        attributes: {
          'aria-expanded': { kind: 'literal', value: false },
          'aria-pressed': { kind: 'literal', value: true },
        },
      }),
      context(),
    )

    expect(source).toBe('<button aria-expanded="false" aria-pressed="true"></button>')
  })

  it('merges the approximation classes and records every class it printed', () => {
    const node = element({ classNames: ['flex', 'gap-4'] })
    const marked = context(new Map([[node, ['ms-reveal']]]))

    expect(printMarkup(node, marked)).toContain('class="flex gap-4 ms-reveal"')
    expect([...marked.usedClasses].sort()).toEqual(['flex', 'gap-4', 'ms-reveal'])
  })

  it('writes custom properties into a style attribute', () => {
    const source = printMarkup(
      element({ cssVars: { '--ms-tint': 'oklch(22% 0.02 285)' } }),
      context(),
    )

    expect(source).toContain('style="--ms-tint: oklch(22% 0.02 285)"')
  })

  it('escapes text and attribute values', () => {
    const source = printMarkup(
      element({
        attributes: { title: { kind: 'literal', value: 'a "b" & c' } },
        children: [{ kind: 'text', value: '<script>alert(1)</script>' }],
      }),
      context(),
    )

    expect(source).toContain('title="a &quot;b&quot; &amp; c"')
    expect(source).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(source).not.toContain('<script>')
  })

  it('writes the descriptor note as an HTML comment above the element', () => {
    const source = printMarkup(element({ notes: ['Wire this to your CMS.'] }), context())

    expect(source.split('\n')[0]).toBe('<!-- Wire this to your CMS. -->')
  })

  it('emits the JSON-LD the block asked for', () => {
    const source = printMarkup(element({ tag: 'section', structuredData: 'FAQPage' }), context())

    expect(source).toContain('<script type="application/ld+json">')
    expect(source).toContain('"@type":"FAQPage"')
  })

  it('reports an expression child rather than printing JavaScript into a document', () => {
    const marked = context()

    printMarkup(element({ children: [{ kind: 'expression', code: 'items.map(render)' }] }), marked)

    expect(marked.warnings[0]?.message).toContain('items.map(render)')
  })
})
