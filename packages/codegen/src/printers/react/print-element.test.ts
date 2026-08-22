import { describe, expect, it } from 'vitest'

import type { IRChild, IRElement } from '../../ir/ir.types'

import {
  PRINT_WIDTH,
  needsStyleType,
  noteLines,
  printElement,
  structuredDataScript,
} from './print-element'

const element = (overrides: Partial<IRElement> = {}): IRElement => ({
  kind: 'element',
  tag: 'div',
  classNames: [],
  attributes: {},
  children: [],
  ...overrides,
})

const text = (value: string): IRChild => ({ kind: 'text', value })

describe('attributes', () => {
  it('quotes a string with double quotes, which is the JSX convention', () => {
    expect(
      printElement(element({ attributes: { alt: { kind: 'literal', value: 'A hero' } } }), 0),
    ).toBe('<div alt="A hero" />')
  })

  it('braces a string that carries a double quote, rather than escaping it', () => {
    const printed = printElement(
      element({ attributes: { alt: { kind: 'literal', value: 'The "studio" canvas' } } }),
      0,
    )

    expect(printed).toBe(`<div alt={'The "studio" canvas'} />`)
  })

  it('prints a true boolean bare and a false one in braces', () => {
    const on = element({ attributes: { 'aria-hidden': { kind: 'literal', value: true } } })
    const off = element({ attributes: { 'aria-hidden': { kind: 'literal', value: false } } })

    expect(printElement(on, 0)).toBe('<div aria-hidden />')
    expect(printElement(off, 0)).toBe('<div aria-hidden={false} />')
  })

  it('braces numbers, expressions and references', () => {
    const printed = printElement(
      element({
        attributes: {
          width: { kind: 'literal', value: 1600 },
          viewport: { kind: 'expression', code: '{ once: true }' },
          src: { kind: 'reference', name: 'src' },
        },
      }),
      0,
    )

    expect(printed).toBe('<div width={1600} viewport={{ once: true }} src={src} />')
  })

  /**
   * The order EXPORT_ENGINE.md § React's example prints in both of its elements. One rule rather than a
   * table: whatever the IR set, then `className`, then `style`.
   */
  it('puts className after the declared attributes and style last', () => {
    const printed = printElement(
      element({
        attributes: { 'aria-hidden': { kind: 'literal', value: true } },
        classNames: ['absolute', 'inset-0'],
        cssVars: { '--ms-glow': 'oklch(70% 0.2 285)' },
      }),
      0,
    )

    expect(printed).toBe(
      `<div\n  aria-hidden\n  className="absolute inset-0"\n  style={{ '--ms-glow': 'oklch(70% 0.2 285)' } as CSSProperties}\n/>`,
    )
  })

  it('prints a key when the IR set one, and nothing when it did not', () => {
    expect(printElement(element({ tag: 'PlanCard', key: 'a' }), 0)).toBe("<PlanCard key='a' />")
    expect(printElement(element({ tag: 'PlanCard' }), 0)).toBe('<PlanCard />')
  })
})

describe('line breaking', () => {
  it('keeps a short element on one line', () => {
    expect(printElement(element({ tag: 'nav', classNames: ['flex'] }), 0)).toBe(
      '<nav className="flex" />',
    )
  })

  it('breaks one attribute per line once the open tag passes the print width', () => {
    const long = element({
      tag: 'section',
      classNames: Array.from({ length: 12 }, (_, index) => `class-number-${index}`),
      attributes: { id: { kind: 'literal', value: 'hero' } },
    })
    const lines = printElement(long, 0).split('\n')

    expect(lines[0]).toBe('<section')
    expect(lines[1]).toBe('  id="hero"')
    expect(lines[3]).toBe('/>')
    expect(lines[0]?.length).toBeLessThanOrEqual(PRINT_WIDTH)
  })

  it('indents by two spaces per level', () => {
    const nested = element({ tag: 'section', children: [element({ tag: 'p' })] })

    expect(printElement(nested, 1)).toBe('  <section>\n    <p />\n  </section>')
  })
})

describe('children', () => {
  it('inlines a single short text child', () => {
    expect(printElement(element({ tag: 'h1', children: [text('Ship code')] }), 0)).toBe(
      '<h1>Ship code</h1>',
    )
  })

  it('breaks a single text child that does not fit', () => {
    const long = 'x'.repeat(120)
    const printed = printElement(element({ tag: 'p', children: [text(long)] }), 0)

    expect(printed).toBe(`<p>\n  ${long}\n</p>`)
  })

  it('prints an expression child in braces', () => {
    const printed = printElement(
      element({ tag: 'p', children: [{ kind: 'expression', code: 'subtitle' }] }),
      0,
    )

    expect(printed).toBe('<p>\n  {subtitle}\n</p>')
  })

  it('escapes text that would end a JSX text run', () => {
    const printed = printElement(
      element({ tag: 'p', children: [text('a < b'), element({ tag: 'br' })] }),
      0,
    )

    expect(printed).toBe(`<p>\n  {'a < b'}\n  <br />\n</p>`)
  })
})

/**
 * JSX collapses whitespace containing a newline, so a space between two inline elements survives being
 * broken onto separate lines only as `{' '}`. An easy thing to get wrong that renders visibly wrong.
 */
describe("{' '} whitespace", () => {
  it('replaces a whitespace-only child between two elements', () => {
    const printed = printElement(
      element({ tag: 'p', children: [element({ tag: 'b' }), text(' '), element({ tag: 'i' })] }),
      0,
    )

    expect(printed).toBe(`<p>\n  <b />\n  {' '}\n  <i />\n</p>`)
  })

  it('drops a whitespace-only child at either end, where it means nothing', () => {
    const printed = printElement(
      element({ tag: 'p', children: [text(' '), element({ tag: 'b' }), text(' ')] }),
      0,
    )

    expect(printed).toBe('<p>\n  <b />\n</p>')
  })

  it('keeps the space a text child carried beside its neighbour', () => {
    const printed = printElement(
      element({ tag: 'p', children: [text('Read '), element({ tag: 'a' }), text(' now')] }),
      0,
    )

    expect(printed).toBe(`<p>\n  Read\n  {' '}\n  <a />\n  {' '}\n  now\n</p>`)
  })
})

describe('notes and structured data', () => {
  it('prints the descriptor notes as JSX comments', () => {
    expect(noteLines(element({ notes: ['Wire this to your CMS.'] }), '  ')).toEqual([
      '  {/* Wire this to your CMS. */}',
    ])
  })

  it('appends a JSON-LD script for the type the block asked for', () => {
    const printed = printElement(element({ tag: 'section', structuredData: 'FAQPage' }), 0)

    expect(printed).toContain('type="application/ld+json"')
    expect(printed).toContain('"@type":"FAQPage"')
    expect(printed).toContain('"mainEntity":[]')
  })

  it('knows the entry list each supported type uses', () => {
    expect(printElement(structuredDataScript('BreadcrumbList'), 0)).toContain(
      '"itemListElement":[]',
    )
  })
})

describe('needsStyleType', () => {
  it('is false for a tree with no custom properties', () => {
    expect(needsStyleType(element({ children: [element({ tag: 'p' })] }))).toBe(false)
  })

  it('is true when any descendant carries one', () => {
    const tree = element({ children: [element({ tag: 'p', cssVars: { '--ms-x': '1px' } })] })

    expect(needsStyleType(tree)).toBe(true)
  })
})
