import { readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pascal } from '@motion-studio/utils'
import { describe, expect, it } from 'vitest'

import * as controlsApi from './controls/index'
import * as publicApi from './index'

/**
 * Contract § 4, public API is barrel-only. Read off disk rather than written down, so adding a directory is
 * what makes this demand its export. ADR-034 took the barrels out of coverage, so nothing else catches it.
 *
 * **Two barrels, not one** — ADR-313. The chrome primitives are `@motion-studio/ui` and the control
 * fields are `@motion-studio/ui/controls`, because one import of `ToastProvider` used to pull 26 field
 * components and their Radix packages into a first load that renders none of them. Each directory is
 * checked against the barrel it belongs to, so a field added under `controls/` still has to be
 * exported — from there.
 */
const SRC = dirname(fileURLToPath(import.meta.url))

/** Not components: shared fragments and test helpers. */
const NOT_A_COMPONENT = new Set(['styles', 'test'])

const directoriesIn = (path: string): string[] =>
  readdirSync(path, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)

const chromeDirectories = directoriesIn(SRC).filter(
  (name) => !NOT_A_COMPONENT.has(name) && name !== 'controls',
)

const controlDirectories = directoriesIn(join(SRC, 'controls'))

describe('the package barrel', () => {
  it('finds the component directories to check', () => {
    // A glob that matches nothing would make every assertion below vacuously true.
    expect(chromeDirectories.length).toBeGreaterThan(0)
    expect(controlDirectories.length).toBeGreaterThan(0)
  })

  it.each(chromeDirectories)('exports the %s component', (directory) => {
    // A prefix rather than an exact name: `toast/` ships `ToastProvider` and `useToast` and no `Toast`,
    // because Radix's toast is a viewport plus a hook rather than one element.
    const expected = pascal(directory)

    expect(Object.keys(publicApi).filter((name) => name.startsWith(expected))).not.toHaveLength(0)
  })

  it.each(controlDirectories)('exports the %s control from ./controls', (directory) => {
    const expected = pascal(directory)

    expect(Object.keys(controlsApi).filter((name) => name.startsWith(expected))).not.toHaveLength(0)
  })

  it('keeps the control fields out of the chrome barrel', () => {
    for (const name of ['SelectField', 'SegmentedField', 'ColorPicker', 'GradientField']) {
      expect(publicApi).not.toHaveProperty(name)
    }
  })

  it('exports the density scale and the shared class fragments', () => {
    for (const name of ['DENSITY', 'GLYPH', 'HEIGHT_CLASS', 'FOCUS_RING', 'TRANSITION_CONTROL']) {
      expect(publicApi).toHaveProperty(name)
    }
  })
})
