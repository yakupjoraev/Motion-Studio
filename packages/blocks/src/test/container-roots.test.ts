import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

/**
 * ADR-380. One rule over every block's classes: **an element that makes itself a container-query
 * root declares a width.**
 *
 * `container-type: inline-size` is size containment in the inline axis, so the element's width may
 * not depend on its contents — which means it contributes nothing to a parent sizing its children by
 * content, and a parent that aligns its children does exactly that. Six roots in this catalogue
 * declared the containment and no width, and every one of them came out 0 px wide when it was placed
 * straight into a band: on the canvas and in the exported page alike.
 *
 * Read off the source rather than off a rendered block, because the rule is about the class list a
 * root is written with: a block that only collapses at one prop combination would pass a test that
 * rendered the defaults.
 */
const STYLES_ROOT = join(__dirname, '..')

const stylesFiles = (directory: string): readonly string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)

    if (entry.isDirectory()) {
      return stylesFiles(path)
    }

    return entry.name.endsWith('.styles.ts') ? [path] : []
  })

/** Comments name the idiom constantly, and a comment is not a class list. */
const withoutComments = (source: string): string =>
  source.replaceAll(/\/\*[\s\S]*?\*\//g, '').replaceAll(/\/\/[^\n]*/g, '')

const FRAME = '@container/frame'

/**
 * Anything that makes the width independent of the contents counts: a percentage, a length, a fixed
 * size, or taking the element out of flow entirely — an absolutely positioned overlay is sized by
 * its insets.
 */
const WIDTH = /\bw-full\b|\bw-\[|\bw-fit\b|\bw-screen\b|\bsize-|\bflex-1\b|\babsolute\b|\bfixed\b/

describe('container-query roots', () => {
  const files = stylesFiles(STYLES_ROOT)

  it('finds the style files it is meant to read', () => {
    expect(files.length).toBeGreaterThan(60)
  })

  it.each(files.map((file) => [file.slice(STYLES_ROOT.length + 1), file] as const))(
    '%s declares a width wherever it declares a frame container',
    (name, file) => {
      const source = withoutComments(readFileSync(file, 'utf8'))

      for (const [, classList] of source.matchAll(/'([^']*)'/g)) {
        if (classList === undefined || !classList.includes(FRAME)) {
          continue
        }

        expect(WIDTH.test(classList), `${name}: ${classList}`).toBe(true)
      }
    },
  )
})
