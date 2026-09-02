import { beforeEach, describe, expect, it } from 'vitest'

import {
  contextEntries,
  lastOf,
  recordCommand,
  recordGesture,
  resetErrorContext,
} from './error-context'

describe('the error context ring buffer', () => {
  beforeEach(() => {
    resetErrorContext()
  })

  it('keeps commands and gestures apart', () => {
    recordGesture('press Mod+z')
    recordCommand('Undo')

    expect(lastOf('gesture')?.label).toBe('press Mod+z')
    expect(lastOf('command')?.label).toBe('Undo')
  })

  it('answers null for a kind that has not happened', () => {
    recordCommand('Add Section')

    expect(lastOf('gesture')).toBeNull()
  })

  it('keeps the last of a kind, not the first', () => {
    recordCommand('Add Section')
    recordCommand('setProp heading')

    expect(lastOf('command')?.label).toBe('setProp heading')
  })

  /**
   * A session that runs for an hour must not hold an hour of gestures: this is read once, in a
   * report, and it is pasted by hand.
   */
  it('holds ten entries and drops the oldest', () => {
    for (let index = 1; index <= 14; index += 1) {
      recordGesture(`gesture ${index}`)
    }

    const entries = contextEntries()

    expect(entries).toHaveLength(10)
    expect(entries[0]?.label).toBe('gesture 5')
    expect(entries.at(-1)?.label).toBe('gesture 14')
  })

  it('stamps each entry with a time, so a report says how long before the failure it happened', () => {
    recordCommand('Add Section')

    expect(contextEntries()[0]?.at).toBeGreaterThanOrEqual(0)
  })

  it('empties on reset, so one test cannot read the buffer another test filled', () => {
    recordCommand('Add Section')
    resetErrorContext()

    expect(contextEntries()).toEqual([])
  })
})
