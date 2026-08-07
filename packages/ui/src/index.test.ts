import { readdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pascal } from '@motion-studio/utils'
import { describe, expect, it } from 'vitest'

import * as publicApi from './index'

/**
 * Contract § 4: "Public API is barrel-only. Each package exports through `src/index.ts`." A component that
 * exists but was never re-exported compiles, tests green, and is invisible to every consumer — and since
 * ADR-034 took the barrels out of the coverage denominator, no other signal catches it either.
 *
 * The expected list is read off disk rather than written down, so adding a component to the directory is
 * what makes this test demand its export.
 */
const SRC = dirname(fileURLToPath(import.meta.url))

/** Not components: `styles` is the shared fragments, `test` is the helpers. Both export by other names. */
const NOT_A_COMPONENT = new Set(['styles', 'test'])

const componentDirectories = readdirSync(SRC, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && !NOT_A_COMPONENT.has(entry.name))
  .map((entry) => entry.name)

describe('the package barrel', () => {
  it('finds the component directories to check', () => {
    // Guards the guard: a glob that matches nothing would make every assertion below vacuously true.
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
