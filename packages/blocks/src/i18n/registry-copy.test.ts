import type { ControlDescriptor } from '@motion-studio/schema'
import { describe, expect, it } from 'vitest'

import { DEFINITIONS } from '../registry'

import { ruRegistryCopy } from './ru'

const definitions = Object.values(DEFINITIONS)

/**
 * Every control a person can see, including the ones inside a list control's rows: `itemControls`
 * is where a repeater keeps the shape of one item, and those labels reach the inspector too.
 */
const isControlDescriptor = (value: unknown): value is ControlDescriptor =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as { label?: unknown }).label === 'string' &&
  typeof (value as { path?: unknown }).path === 'string'

function controlsOf(definition: (typeof definitions)[number]): readonly ControlDescriptor[] {
  const flatten = (controls: readonly ControlDescriptor[]): readonly ControlDescriptor[] =>
    controls.flatMap((control) => {
      const nested = control.options?.['itemControls']
      const rows = Array.isArray(nested) ? nested.filter(isControlDescriptor) : []

      return [control, ...flatten(rows)]
    })

  return flatten(definition.controls.flatMap((group) => group.controls))
}

describe('the Russian registry copy answers the registry', () => {
  it('names and describes every block', () => {
    const missing = definitions
      .filter((definition) => ruRegistryCopy.blocks[definition.id] === undefined)
      .map((definition) => definition.id)

    expect(missing).toEqual([])
  })

  it('translates every control group heading', () => {
    const missing = new Set<string>()

    for (const definition of definitions) {
      for (const group of definition.controls) {
        if (ruRegistryCopy.labels[group.label] === undefined) {
          missing.add(group.label)
        }
      }
    }

    expect([...missing]).toEqual([])
  })

  it('translates every control label', () => {
    const missing = new Set<string>()

    for (const definition of definitions) {
      for (const control of controlsOf(definition)) {
        if (ruRegistryCopy.labels[control.label] === undefined) {
          missing.add(control.label)
        }
      }
    }

    expect([...missing]).toEqual([])
  })

  it('translates every control hint', () => {
    const missing = new Set<string>()

    for (const definition of definitions) {
      for (const control of controlsOf(definition)) {
        if (control.hint !== undefined && ruRegistryCopy.hints[control.hint] === undefined) {
          missing.add(control.hint)
        }
      }
    }

    expect([...missing]).toEqual([])
  })

  it('translates every slot label', () => {
    const missing = new Set<string>()

    for (const definition of definitions) {
      for (const slot of definition.slots) {
        if (ruRegistryCopy.labels[slot.label] === undefined) {
          missing.add(slot.label)
        }
      }
    }

    expect([...missing]).toEqual([])
  })

  /**
   * The insert-time patch of ADR-364. It is applied over `definition.defaults` and then validated by
   * the block's own schema, so a key the definition dropped would fail at the point a user inserts
   * the block — a defect nobody would attribute to a translation. The parse is what this asserts.
   */
  it('patches defaults every block still declares, and the schema still accepts', () => {
    const wrong: string[] = []

    for (const [id, patch] of Object.entries(ruRegistryCopy.defaults)) {
      const definition = definitions.find((one) => one.id === id)

      if (definition === undefined) {
        wrong.push(`${id}: no such block`)
        continue
      }

      const defaults = definition.defaults as Record<string, unknown>

      for (const key of Object.keys(patch)) {
        if (!(key in defaults)) {
          wrong.push(`${id}.${key}: not a prop of the block`)
        }
      }

      const parsed = definition.propsSchema.safeParse({ ...defaults, ...patch })

      if (!parsed.success) {
        wrong.push(`${id}: ${parsed.error.issues[0]?.path.join('.')} rejected`)
      }
    }

    expect(wrong).toEqual([])
  })

  /**
   * Which blocks insert with English text, as a number rather than a surprise — ADR-364 asks for
   * exactly this. One block is left: `code-block`, whose prose is the code sample itself.
   */
  it('covers every block whose defaults are prose', () => {
    const prose = (value: unknown): boolean =>
      typeof value === 'string' && /\p{L}{2}/u.test(value) && value.includes(' ')

    const carries = (value: unknown): boolean =>
      prose(value) ||
      (Array.isArray(value) &&
        value.some(
          (row) =>
            typeof row === 'object' && row !== null && Object.values(row).some((one) => prose(one)),
        ))

    const untranslated = definitions
      .filter((definition) => ruRegistryCopy.defaults[definition.id] === undefined)
      .filter((definition) =>
        Object.values(definition.defaults as Record<string, unknown>).some(carries),
      )
      .map((definition) => definition.id)

    expect(untranslated).toEqual(['code-block'])
  })

  /*
   * The other direction. An entry nobody reads is a string that was translated once and then
   * renamed in the definition — the table would keep answering a question no control asks.
   */
  it('has no entry the registry does not use', () => {
    const used = new Set<string>()

    for (const definition of definitions) {
      for (const group of definition.controls) {
        used.add(group.label)
      }

      for (const control of controlsOf(definition)) {
        used.add(control.label)
      }

      for (const slot of definition.slots) {
        used.add(slot.label)
      }
    }

    expect(Object.keys(ruRegistryCopy.labels).filter((label) => !used.has(label))).toEqual([])
  })
})
