import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { blockRegistry } from '@motion-studio/blocks/registry'
import { describeProps } from '@motion-studio/schema'
import { describe, expect, it } from 'vitest'

const HERE = dirname(fileURLToPath(import.meta.url))

const sources = (): readonly { readonly path: string; readonly text: string }[] => {
  const files: { path: string; text: string }[] = []

  const walk = (directory: string): void => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name)

      if (entry.isDirectory()) {
        walk(path)
      } else if (entry.name.endsWith('.tsx') && !entry.name.includes('.test.')) {
        files.push({ path, text: readFileSync(path, 'utf8') })
      }
    }
  }

  walk(HERE)

  return files
}

/**
 * `prompts/52` § Controls reuse the inspector system: "If you find yourself writing a control
 * component in `apps/web/src/components/gallery/`, stop. Two control systems would drift and the
 * gallery would slowly stop matching the studio."
 *
 * A rule nobody checks is a rule that lasts until the first inconvenient afternoon, so this is the
 * check. It reads the directory rather than a list, which means a control component added in a file
 * this test has never heard of still fails it.
 */
describe('the gallery does not own a control system', () => {
  it('renders every control through the shared renderer', () => {
    const rendering = sources().filter((file) => file.text.includes('ControlRenderer'))

    expect(rendering.length).toBeGreaterThan(0)

    for (const file of rendering) {
      // `@motion-studio/ui/controls` since ADR-313 split the field barrel off the chrome one; the
      // rule is unchanged — the renderer comes from the package, not from this directory.
      expect(file.text, `${file.path} imports the shared renderer`).toContain(
        "from '@motion-studio/ui/controls'",
      )
    }
  })

  it('defines no field of its own', () => {
    for (const file of sources()) {
      expect(
        /export function \w*(Field|Picker|Slider|Scrub|Stepper|Swatch)\b/.test(file.text),
        `${file.path} defines a control`,
      ).toBe(false)
    }
  })
})

/**
 * The props table is generated, so the assertion is not "these rows are right" — it is that the rows
 * are the schema's own, for every block in the catalogue rather than for the one that was checked by
 * hand.
 */
describe('the props table is the schema', () => {
  it('has a row per schema key, for all 72 blocks', () => {
    for (const definition of blockRegistry.list()) {
      const shape = (definition.propsSchema as { shape?: Record<string, unknown> }).shape

      if (shape === undefined) {
        continue
      }

      const rows = describeProps(definition)

      expect(
        rows.map((row) => row.name),
        `${definition.id} rows`,
      ).toEqual(Object.keys(shape))
    }
  })

  it('prints the block’s own default for every prop that has one', () => {
    for (const definition of blockRegistry.list()) {
      const defaults = definition.defaults as Record<string, unknown>

      for (const row of describeProps(definition)) {
        if (!(row.name in defaults)) {
          expect(row.defaultValue, `${definition.id}.${row.name}`).toBe('—')
          continue
        }

        const value = defaults[row.name]
        const printed = typeof value === 'string' ? `'${value}'` : JSON.stringify(value)

        expect(row.defaultValue, `${definition.id}.${row.name}`).toBe(printed)
      }
    }
  })
})
