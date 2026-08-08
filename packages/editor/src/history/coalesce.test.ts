import { describe, expect, it } from 'vitest'

import { COALESCE_WINDOW_MS, mergeEntries, shouldCoalesce } from './coalesce'
import type { HistoryEntry, IncomingEntry } from './history.types'

const entry = (overrides: Partial<HistoryEntry> = {}): HistoryEntry => ({
  id: 'hist_1',
  label: 'Set opacity',
  patches: [{ op: 'replace', path: ['nodes', 'node_a', 'props', 'opacity'], value: 0.9 }],
  inversePatches: [{ op: 'replace', path: ['nodes', 'node_a', 'props', 'opacity'], value: 1 }],
  selectionBefore: [],
  coalesceKey: 'set-prop:node_a:opacity',
  timestamp: 1000,
  ...overrides,
})

const incoming = (overrides: Partial<IncomingEntry> = {}): IncomingEntry => ({
  label: 'Set opacity',
  patches: [{ op: 'replace', path: ['nodes', 'node_a', 'props', 'opacity'], value: 0.8 }],
  inversePatches: [{ op: 'replace', path: ['nodes', 'node_a', 'props', 'opacity'], value: 0.9 }],
  selectionBefore: [],
  coalesceKey: 'set-prop:node_a:opacity',
  ...overrides,
})

describe('shouldCoalesce', () => {
  it('merges the same key inside the window', () => {
    expect(shouldCoalesce(entry(), incoming(), 1200, COALESCE_WINDOW_MS)).toBe(true)
  })

  it('starts a new entry once the window has passed', () => {
    expect(shouldCoalesce(entry(), incoming(), 1500, COALESCE_WINDOW_MS)).toBe(false)
  })

  it('never merges two different keys', () => {
    expect(
      shouldCoalesce(entry(), incoming({ coalesceKey: 'set-prop:node_a:width' }), 1010, 400),
    ).toBe(false)
  })

  it('never merges a command that declares no key', () => {
    expect(shouldCoalesce(entry(), incoming({ coalesceKey: null }), 1010, 400)).toBe(false)
  })

  it('has nothing to merge into on an empty history', () => {
    expect(shouldCoalesce(undefined, incoming(), 1010, 400)).toBe(false)
  })

  it('is off entirely for a window of zero', () => {
    expect(shouldCoalesce(entry(), incoming(), 1000, 0)).toBe(false)
  })
})

describe('mergeEntries', () => {
  it('keeps the older inverse patches and takes the newer forward ones', () => {
    const merged = mergeEntries(entry(), incoming(), 1200)

    expect(merged.inversePatches).toEqual(entry().inversePatches)
    expect(merged.patches).toEqual(incoming().patches)
    expect(merged.timestamp).toBe(1200)
    expect(merged.id).toBe('hist_1')
  })
})
