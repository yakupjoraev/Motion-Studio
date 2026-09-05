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
