'use client'

import { type MotionPreset, PRESETS } from '@motion-studio/motion'
import type { MotionChannel } from '@motion-studio/schema'
import { useDeferredValue, useMemo, useSyncExternalStore } from 'react'

import { type FuzzyTarget, fuzzyScore } from '../command-palette/fuzzy-match'

/**
 * The Motion tab's search and channel filter — ADR-355, and deliberately the same shape as
 * `use-block-search.ts`. Fifty-one presets in six channels were reachable only by scrolling past the
 * five channels above the one you wanted.
 */
const TARGETS: ReadonlyMap<string, FuzzyTarget> = new Map(
  PRESETS.map((preset) => [
    preset.id,
    { label: preset.name, keywords: [preset.channel, preset.id] },
  ]),
)

export interface PresetSearchState {
  readonly presets: readonly MotionPreset[]
  /** The query the results describe. Deferred, so the count never contradicts the grid beside it. */
  readonly query: string
}

export function searchPresets(query: string, channels: ReadonlySet<string>): PresetSearchState {
  const pool = channels.size === 0 ? PRESETS : PRESETS.filter((one) => channels.has(one.channel))
  const trimmed = query.trim()

  if (trimmed === '') {
    return { presets: pool, query: trimmed }
  }

  const scored: { preset: MotionPreset; score: number }[] = []

  for (const preset of pool) {
    const score = fuzzyScore(TARGETS.get(preset.id) ?? { label: preset.name }, trimmed)

    if (score !== null) {
      scored.push({ preset, score })
    }
  }

  // `sort` is stable, so presets that score the same stay in catalogue order.
  return {
    presets: scored.sort((a, b) => b.score - a.score).map((one) => one.preset),
    query: trimmed,
  }
}

export function usePresetSearch(query: string): PresetSearchState {
  const deferred = useDeferredValue(query)
  const channels = useSelectedChannels()

  return useMemo(() => searchPresets(deferred, channels), [channels, deferred])
}

/** How many presets each channel holds — the number on a chip. */
export function channelCounts(): ReadonlyMap<MotionChannel, number> {
  const counts = new Map<MotionChannel, number>()

  for (const preset of PRESETS) {
    counts.set(preset.channel, (counts.get(preset.channel) ?? 0) + 1)
  }

  return counts
}

/*
 * Session state in this module, exactly as the block chips are held (ADR-165): a filter changes
 * nothing that exports, and one still applied tomorrow would read as an empty catalogue.
 */
const listeners = new Set<() => void>()
let selected: ReadonlySet<string> = new Set()

const notify = (): void => {
  for (const listener of listeners) {
    listener()
  }
}

export function toggleChannel(channel: string): void {
  const next = new Set(selected)

  if (!next.delete(channel)) {
    next.add(channel)
  }

  selected = next
  notify()
}

export function clearChannels(): void {
  if (selected.size === 0) {
    return
  }

  selected = new Set()
  notify()
}

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

const EMPTY: ReadonlySet<string> = new Set()

/** The server render has no session, so it filters nothing — the same answer as a fresh tab. */
export const useSelectedChannels = (): ReadonlySet<string> =>
  useSyncExternalStore(
    subscribe,
    () => selected,
    () => EMPTY,
  )
