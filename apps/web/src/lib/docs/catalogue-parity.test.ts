import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { blockRegistry } from '@motion-studio/blocks/registry'
import { PRESETS } from '@motion-studio/motion/presets'
import { describe, expect, it } from 'vitest'

/**
 * The audit for v1.0 asked whether `COMPONENT_LIBRARY.md` § Catalogue and `ANIMATION_SYSTEM.md`
 * § Preset catalogue still list what is registered. They did — and nothing would have said so if
 * they had stopped. Both documents claim a count in a heading and then enumerate the entries, which
 * is exactly the pair of claims a test can hold to the registries.
 *
 * `apps/web` is where this lives because it is the only workspace that depends on both registries
 * and already reads `docs/` as the content of its `/docs` route.
 */
const docs = (name: string): string =>
  readFileSync(join(import.meta.dirname, '../../../../../docs', name), 'utf8')

const LIBRARY = docs('COMPONENT_LIBRARY.md')
const ANIMATION = docs('ANIMATION_SYSTEM.md')

/** `### Marketing (12)` — the heading carries the count, so a stale one is a failure. */
const documentedCategories = (): ReadonlyMap<string, number> => {
  const counts = new Map<string, number>()

  for (const match of LIBRARY.matchAll(/^### ([A-Za-z]+) \((\d+)\)$/gm)) {
    counts.set((match[1] ?? '').toLowerCase(), Number(match[2]))
  }

  return counts
}

/** Every backticked name in the first column of a channel's table, `a` / `b` / `c` rows included. */
const documentedPresets = (channel: string): readonly string[] => {
  const heading = new RegExp(`^### .*\`channel: '${channel}'\`.*$`, 'm')
  const start = ANIMATION.search(heading)

  if (start < 0) return []

  // Past the end of the heading's own line, or the next search finds the heading it just matched.
  const rest = ANIMATION.slice(ANIMATION.indexOf('\n', start) + 1)
  const end = rest.search(/^#{2,3} /m)
  const section = end < 0 ? rest : rest.slice(0, end)
  const rows = section.split(/\r?\n/).filter((line) => line.startsWith('|'))
  const ids = new Set<string>()

  // Five channels are tables; `exit` is a sentence, because five names need no three columns. Both
  // spell the ids in backticks, so the only difference is where to look.
  const spans = rows.length > 0 ? rows.map((line) => line.split('|')[1] ?? '') : [section]

  for (const span of spans) {
    for (const match of span.matchAll(/`([a-z][a-z0-9-]*)`/g)) {
      ids.add(match[1] ?? '')
    }
  }

  return [...ids]
}

describe('the catalogue documents', () => {
  it('count the blocks the registry actually holds, category by category', () => {
    const documented = documentedCategories()
    const registered = new Map<string, number>()

    for (const definition of blockRegistry.list()) {
      registered.set(definition.category, (registered.get(definition.category) ?? 0) + 1)
    }

    expect([...documented.keys()].sort()).toEqual([...registered.keys()].sort())

    for (const [category, count] of registered) {
      expect(documented.get(category), category).toBe(count)
    }
  })

  it('add up to the registry total, so a new block cannot arrive uncounted', () => {
    const total = [...documentedCategories().values()].reduce((sum, count) => sum + count, 0)

    expect(total).toBe(blockRegistry.list().length)
  })

  it('list every preset of every channel, and no preset that was removed', () => {
    const channels = [...new Set(PRESETS.map((preset) => preset.channel))]

    expect(channels.length).toBeGreaterThan(0)

    for (const channel of channels) {
      const registered = PRESETS.filter((preset) => preset.channel === channel).map(
        (preset) => preset.id,
      )

      expect([...documentedPresets(channel)].sort(), channel).toEqual([...registered].sort())
    }
  })
})
