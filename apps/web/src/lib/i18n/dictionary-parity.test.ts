import { describe, expect, it } from 'vitest'

import { en } from './dictionaries/en'
import { ru } from './dictionaries/ru'
import { LOCALES } from './locales'
import { formatPlural } from './plural'

type Value = string | { readonly [key: string]: unknown } | readonly unknown[]

/** Every leaf, as `surface.key` paths, so a failure names the string rather than the object. */
function paths(value: unknown, prefix = ''): readonly string[] {
  if (typeof value !== 'object' || value === null) {
    return [prefix]
  }

  return Object.entries(value as Record<string, Value>).flatMap(([key, nested]) =>
    paths(nested, prefix === '' ? key : `${prefix}.${key}`),
  )
}

const enPaths = new Set(paths(en))
const ruPaths = new Set(paths(ru))

/**
 * The compiler already refuses a Russian dictionary that is missing a key — `ru` is typed as
 * `Dictionary` (ADR-360). These tests cover what the type cannot:
 *
 * - a plural form that English does not have (`few`, `many`) is a key the type does not describe,
 *   so a Russian counter with three forms passes type-checking and could still be missing one;
 * - a placeholder that a translation dropped changes what a sentence says without changing its type;
 * - an untranslated string is a valid `string`.
 */
describe('the Russian dictionary answers the English one', () => {
  it('has every plural form Russian needs where English has two', () => {
    const missing: string[] = []

    for (const path of enPaths) {
      if (!path.endsWith('.one')) {
        continue
      }

      const base = path.slice(0, -'.one'.length)

      for (const form of ['one', 'few', 'many', 'other']) {
        if (!ruPaths.has(`${base}.${form}`)) {
          missing.push(`${base}.${form}`)
        }
      }
    }

    expect(missing).toEqual([])
  })

  it('keeps every placeholder the English string declares', () => {
    const dropped: string[] = []
    const read = (source: unknown, path: string): string | undefined => {
      let current: unknown = source

      for (const segment of path.split('.')) {
        current = (current as Record<string, unknown>)[segment]
      }

      return typeof current === 'string' ? current : undefined
    }

    for (const path of enPaths) {
      const english = read(en, path)
      const russian = ruPaths.has(path) ? read(ru, path) : undefined

      if (english === undefined || russian === undefined) {
        continue
      }

      for (const placeholder of english.match(/\{\w+\}/g) ?? []) {
        if (!russian.includes(placeholder)) {
          dropped.push(`${path} lost ${placeholder}`)
        }
      }
    }

    expect(dropped).toEqual([])
  })

  it('leaves no sentence untranslated', () => {
    /*
     * A handful of strings are the same in both languages on purpose: a brand, a licence, a format's
     * name, and the numeric code of a 404. Every other identical string is one nobody translated.
     */
    const SHARED = new Set([
      'nav.brand',
      'nav.footerLicence',
      'errors.notFoundCode',
      'landing.ogTitle',
      'landing.architecture.appNote',
      'landing.problem.designExamples',
      'landing.problem.libraryExamples',
      'gallery.detail.copyReact',
      'studio.chrome.brand',
      'studio.chrome.commandPalette',
      // Names of the things themselves: a target, a language, a file format.
      'studio.export.targetReact',
      'studio.export.targetNext',
      'studio.export.targetHtml',
      'studio.export.targetJson',
      'studio.export.typescript',
      'studio.export.javascript',
    ])

    const identical: string[] = []
    const read = (source: unknown, path: string): unknown => {
      let current: unknown = source

      for (const segment of path.split('.')) {
        current = (current as Record<string, unknown>)[segment]
      }

      return current
    }

    for (const path of enPaths) {
      if (SHARED.has(path) || path.startsWith('studio.chrome.shortcut')) {
        continue
      }

      const english = read(en, path)
      const russian = ruPaths.has(path) ? read(ru, path) : undefined

      // A string of digits or punctuation — "404", "01 / gap" — is not a translation gap.
      if (typeof english === 'string' && english === russian && /\p{L}{3}/u.test(english)) {
        identical.push(path)
      }
    }

    expect(identical).toEqual([])
  })
})

describe('plural forms', () => {
  it.each([
    [1, '1 блок'],
    [2, '2 блока'],
    [5, '5 блоков'],
    [21, '21 блок'],
    [104, '104 блока'],
  ])('%d → %s', (count, expected) => {
    expect(formatPlural('ru', count, ru.gallery.blockCount)).toBe(expected)
  })

  it('uses the English pair for English', () => {
    expect(formatPlural('en', 1, en.gallery.blockCount)).toBe('1 block')
    expect(formatPlural('en', 4, en.gallery.blockCount)).toBe('4 blocks')
  })

  it('covers every locale the product ships', () => {
    expect(LOCALES).toEqual(['en', 'ru'])
  })
})
