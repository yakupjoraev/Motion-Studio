import { existsSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { HERO_THUMBNAIL } from './hero-thumbnail'

/**
 * The hero names a thumbnail by path so the landing does not carry the whole manifest. A path is a
 * promise nothing keeps, so this is what keeps it: the file the first screen asks for is on disk.
 */
describe('the hero card thumbnail', () => {
  it('is a file the generator has produced', () => {
    const onDisk = join(process.cwd(), 'public', HERO_THUMBNAIL.src.replace(/^\//, ''))

    expect(existsSync(onDisk), `${HERO_THUMBNAIL.src} is not in public/`).toBe(true)
  })
})
