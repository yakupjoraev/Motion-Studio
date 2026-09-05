import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { en } from './dictionaries/en'

/**
 * A key nobody reads is a string the product still shows in English. That is not a hypothetical:
 * the first translation pass wrote `panels.motionSelectOne` and never wired the inspector to it, so
 * the dictionary parity test was green while the panel was English. The type system cannot see this
 * — an unused property is legal — so the source tree is read instead.
 *
 * The check is deliberately loose: a bare `.key` anywhere in `apps/web` counts. It answers one
 * question, "does anything reference this string at all", and a looser answer never fails a key that
 * is genuinely wired.
 */
const ROOT = join(import.meta.dirname, '../../..')

const sources = (): readonly string[] => {
  const files: string[] = []

  const walk = (directory: string): void => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name)

      if (entry.isDirectory()) {
        // The dictionaries define the keys; reading one there would count a definition as a use.
        if (entry.name !== 'node_modules' && entry.name !== 'dictionaries') {
          walk(path)
        }
      } else if (/\.tsx?$/.test(path)) {
        files.push(path)
      }
    }
  }

  walk(join(ROOT, 'src'))
  walk(join(ROOT, 'app'))

  return files
}

const SOURCE = sources()
  .map((path) => readFileSync(path, 'utf8'))
  .join('\n')

const IDENTIFIER = /^[a-z][A-Za-z0-9]*$/
const PLURAL_FORMS = new Set(['one', 'few', 'many', 'other'])

const isTable = (value: object): boolean =>
  Object.keys(value).some((key) => !IDENTIFIER.test(key)) ||
  Object.keys(value).every((key) => PLURAL_FORMS.has(key))

/**
 * Every key a component names. Descent stops at two kinds of object, because their own keys are not
 * written in the source: a lookup table keyed by an English string (`chrome.shortcutLabels`) and a
 * plural pair, both of which are read through the parent key alone.
 */
function keys(value: unknown, prefix = ''): readonly (readonly [string, string])[] {
  if (typeof value !== 'object' || value === null || isTable(value)) {
    return prefix === '' ? [] : [[prefix.split('.').at(-1) ?? prefix, prefix]]
  }

  return Object.entries(value).flatMap(([key, nested]) =>
    keys(nested, prefix === '' ? key : `${prefix}.${key}`),
  )
}

describe('the English dictionary', () => {
  it('has no key the product never reads', () => {
    const unread = keys(en)
      .filter(([key]) => !SOURCE.includes(`.${key}`) && !SOURCE.includes(`'${key}'`))
      .map(([, path]) => path)

    expect(unread).toEqual([])
  })
})
