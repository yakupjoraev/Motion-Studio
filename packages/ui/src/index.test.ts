import { readdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pascal } from '@motion-studio/utils'
import { describe, expect, it } from 'vitest'

import * as publicApi from './index'

/**
 * Contract § 4, public API is barrel-only. Read off disk rather than written down, so adding a directory is
 * what makes this demand its export. ADR-034 took the barrels out of coverage, so nothing else catches it.
 */
const SRC = dirname(fileURLToPath(import.meta.url))

/** Not components: shared fragments and test helpers. */
const NOT_A_COMPONENT = new Set(['styles', 'test'])

const componentDirectories = readdirSync(SRC, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && !NOT_A_COMPONENT.has(entry.name))
  .map((entry) => entry.name)

describe('the package barrel', () => {
  it('finds the component directories to check', () => {
    // A glob that matches nothing would make every assertion below vacuously true.
    expect(componentDirectories.length).toBeGreaterThan(0)
  })

  it.each(componentDirectories)('exports the %s component', (directory) => {
    // A prefix rather than an exact name: `toast/` ships `ToastProvider` and `useToast` and no `Toast`,
    // because Radix's toast is a viewport plus a hook rather than one element.
    const expected = pascal(directory)

    expect(Object.keys(publicApi).filter((name) => name.startsWith(expected))).not.toHaveLength(0)
  })

  it('exports the density scale and the shared class fragments', () => {
    for (const name of ['DENSITY', 'GLYPH', 'HEIGHT_CLASS', 'FOCUS_RING', 'TRANSITION_CONTROL']) {
      expect(publicApi).toHaveProperty(name)
    }
  })
})
