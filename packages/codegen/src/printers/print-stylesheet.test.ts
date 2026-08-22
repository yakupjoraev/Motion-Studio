import { describe, expect, it } from 'vitest'

import type { IRStylesheet } from '../ir/ir.types'

import { printJson, printJsonFile } from './print-json'
import { isEmpty, printStylesheet } from './print-stylesheet'

const sheet = (overrides: Partial<IRStylesheet> = {}): IRStylesheet => ({
  rules: [],
  keyframes: [],
  ...overrides,
})

describe('printStylesheet', () => {
  it('prints a rule as a block with one declaration per line', () => {
    const printed = printStylesheet(
      sheet({
        rules: [
          { selector: '.v-tint', declarations: ['background-color: var(--ms-tint)', 'color: red'] },
        ],
      }),
    )

    expect(printed).toBe('.v-tint {\n  background-color: var(--ms-tint);\n  color: red;\n}')
  })

  /** One `@media` block per query, not one per rule: eight presets share one reduced-motion block. */
  it('groups every rule that shares a media query', () => {
    const printed = printStylesheet(
      sheet({
        rules: [
          {
            selector: '.a',
            declarations: ['animation: none'],
            media: '(prefers-reduced-motion: reduce)',
          },
          {
            selector: '.b',
            declarations: ['animation: none'],
            media: '(prefers-reduced-motion: reduce)',
          },
        ],
      }),
    )

    expect(printed).toBe(
      '@media (prefers-reduced-motion: reduce) {\n  .a {\n    animation: none;\n  }\n\n  .b {\n    animation: none;\n  }\n}',
    )
  })

  it('puts unconditional rules before the media blocks and keyframes last', () => {
    const printed = printStylesheet(
      sheet({
        rules: [
          {
            selector: '.b',
            declarations: ['animation: none'],
            media: '(prefers-reduced-motion: reduce)',
          },
          { selector: '.a', declarations: ['color: red'] },
        ],
        keyframes: ['@keyframes ms-shine {\n  to { background-position: 200% 0; }\n}'],
      }),
    )
    const order = ['.a {', '@media', '@keyframes'].map((needle) => printed.indexOf(needle))

    expect(order).toEqual([...order].sort((left, right) => left - right))
  })

  it('knows when there is nothing to write', () => {
    expect(isEmpty(sheet())).toBe(true)
    expect(isEmpty(sheet({ keyframes: ['@keyframes a {}'] }))).toBe(false)
  })
})

/**
 * `JSON.stringify(value, null, 2)` puts `"lib": ["dom", "dom.iterable", "esnext"]` on three lines, and
 * the result reads as machine output. What `create-next-app` writes is the target.
 */
describe('printJson', () => {
  it('keeps a short array of primitives on one line', () => {
    expect(printJson({ lib: ['dom', 'esnext'] })).toBe('{\n  "lib": ["dom", "esnext"]\n}')
  })

  it('expands an array once it passes the width', () => {
    const long = Array.from({ length: 12 }, (_, index) => `a-fairly-long-entry-${index}`)

    expect(printJson({ list: long }).split('\n').length).toBeGreaterThan(12)
  })

  it('expands an array of objects, which is what a plugin list is', () => {
    expect(printJson({ plugins: [{ name: 'next' }] })).toBe(
      '{\n  "plugins": [\n    {\n      "name": "next"\n    }\n  ]\n}',
    )
  })

  it('always expands an object, and collapses only an empty one', () => {
    expect(printJson({ a: { b: 1 } })).toBe('{\n  "a": {\n    "b": 1\n  }\n}')
    expect(printJson({ a: {}, b: [] })).toBe('{\n  "a": {},\n  "b": []\n}')
  })

  it('prints primitives and ends a file with one newline', () => {
    expect(printJson(null)).toBe('null')
    expect(printJson(true)).toBe('true')
    expect(printJsonFile({ a: 1 })).toBe('{\n  "a": 1\n}\n')
  })
})
