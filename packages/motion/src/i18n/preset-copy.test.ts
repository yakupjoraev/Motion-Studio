import { describe, expect, it } from 'vitest'

import { PRESETS } from '../presets'

import { ruPresetCopy } from './ru'

/**
 * Both directions, like `registry-copy.test.ts`: a preset with no entry ships an English name in a
 * Russian session, and an entry no preset claims is a translation that outlived a rename.
 */
describe('the Russian preset copy answers the catalogue', () => {
  it('names every preset', () => {
    const missing = PRESETS.filter((preset) => ruPresetCopy.presets[preset.id] === undefined).map(
      (preset) => preset.id,
    )

    expect(missing).toEqual([])
  })

  it('translates every control label', () => {
    const missing = new Set<string>()

    for (const preset of PRESETS) {
      for (const control of preset.controls) {
        if (ruPresetCopy.labels[control.label] === undefined) {
          missing.add(control.label)
        }
      }
    }

    expect([...missing]).toEqual([])
  })

  it('names every channel the catalogue uses', () => {
    const missing = new Set<string>()

    for (const preset of PRESETS) {
      if (ruPresetCopy.channels[preset.channel] === undefined) {
        missing.add(preset.channel)
      }
    }

    expect([...missing]).toEqual([])
  })

  it('has no entry the catalogue does not use', () => {
    const ids = new Set(PRESETS.map((preset) => preset.id))
    const labels = new Set(PRESETS.flatMap((preset) => preset.controls.map((one) => one.label)))

    expect(Object.keys(ruPresetCopy.presets).filter((id) => !ids.has(id))).toEqual([])
    expect(Object.keys(ruPresetCopy.labels).filter((label) => !labels.has(label))).toEqual([])
  })
})
