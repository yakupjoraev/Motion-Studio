import { afterEach, describe, expect, it, vi } from 'vitest'

import { counterIds, createId } from './id'

const BASE58 = /^[1-9A-HJ-NP-Za-km-z]{22}$/

afterEach(() => {
  vi.restoreAllMocks()
})

/**
 * Replaces the platform random source with a fixed byte sequence, cycled. Stubbing
 * `crypto.getRandomValues` — a platform API, not one of our modules — is what lets the
 * rejection-sampling branch be exercised on purpose rather than waited for.
 */
function stubRandomBytes(sequence: readonly number[]): void {
  let cursor = 0

  vi.spyOn(crypto, 'getRandomValues').mockImplementation(
    <T extends ArrayBufferView | null>(target: T): T => {
      if (target instanceof Uint8Array) {
        for (let i = 0; i < target.length; i += 1) {
          target[i] = sequence[cursor % sequence.length] ?? 0
          cursor += 1
        }
      }

      return target
    },
  )
}

describe('createId', () => {
  it('prefixes with the given name and an underscore', () => {
    expect(createId('node')).toMatch(/^node_/)
    expect(createId('asset')).toMatch(/^asset_/)
  })

  it('produces 22 characters after the prefix', () => {
    expect(createId('node').slice('node_'.length)).toHaveLength(22)
  })

  it('uses only base58 characters, so no 0, O, I, or l', () => {
    for (let i = 0; i < 200; i += 1) {
      expect(createId('node').slice('node_'.length)).toMatch(BASE58)
    }
  })

  it('does not repeat across many calls', () => {
    const ids = new Set(Array.from({ length: 1000 }, () => createId('node')))

    expect(ids.size).toBe(1000)
  })

  it('rejects bytes at or above 232 rather than folding them onto the alphabet', () => {
    // 232 and 255 would map to '1' and 'A' with a plain modulo. Every accepted byte here is 0, which
    // maps to '1', so a leaked rejected byte would show up as a character that is not '1'.
    stubRandomBytes([232, 0, 255, 0])

    expect(createId('node')).toBe(`node_${'1'.repeat(22)}`)
  })

  it('requests more bytes when rejections leave the id short', () => {
    // Half the bytes are rejected, so one round of 22 bytes yields 11 characters and a second round
    // is required. The spy count proves the outer loop ran twice.
    stubRandomBytes([240, 0])

    createId('node')

    expect(crypto.getRandomValues).toHaveBeenCalledTimes(2)
  })

  it('stops at 22 characters even when a round supplies more than are needed', () => {
    stubRandomBytes([0])

    expect(createId('node').slice('node_'.length)).toHaveLength(22)
  })

  it('accepts an empty prefix, leaving a leading underscore', () => {
    expect(createId('')).toMatch(/^_[1-9A-HJ-NP-Za-km-z]{22}$/)
  })
})

describe('counterIds', () => {
  it('counts from 1 with the node prefix by default', () => {
    const nextId = counterIds()

    expect(nextId()).toBe('node_1')
    expect(nextId()).toBe('node_2')
    expect(nextId()).toBe('node_3')
  })

  it('honours a custom prefix', () => {
    const nextId = counterIds('fx')

    expect(nextId()).toBe('fx_1')
    expect(nextId()).toBe('fx_2')
  })

  it('gives each generator its own sequence, so one test cannot shift another', () => {
    const first = counterIds()
    const second = counterIds()

    expect(first()).toBe('node_1')
    expect(first()).toBe('node_2')
    expect(second()).toBe('node_1')
  })

  it('never calls the platform random source', () => {
    const spy = vi.spyOn(crypto, 'getRandomValues')
    const nextId = counterIds()

    nextId()
    nextId()

    expect(spy).not.toHaveBeenCalled()
  })
})
