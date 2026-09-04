import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { ShortcutConflictError, createShortcutRegistry, findConflicts } from '@motion-studio/hooks'
import { describe, expect, it } from 'vitest'

import type { StudioShortcut } from './shortcut.types'
import { STUDIO_SHORTCUTS, studioShortcuts } from './studio-registry'

/**
 * SHORTCUTS.md is **read**, not transcribed. A key list copied into this file cannot fail when the
 * document changes, and that is the only failure worth having here: the reference sheet, the command
 * palette and that table all claim to describe this one registry.
 */
const DOCUMENT = readFileSync(
  join(import.meta.dirname, '../../../../../../docs/SHORTCUTS.md'),
  'utf8',
)

/** Pointer gestures belong to the canvas, and a lone modifier in the table is a hold, not a binding. */
const GESTURE = /click|drag|scroll|wheel|hover/
const HOLD = new Set(['shift', 'alt', 'mod', 'ctrl', 'cmd'])
const ARROWS: Record<string, string> = { '↑': 'up', '↓': 'down', '←': 'left', '→': 'right' }

const canonical = (token: string): string =>
  token
    .trim()
    .toLowerCase()
    .replace(/[↑↓←→]/g, (arrow) => ARROWS[arrow] ?? arrow)
    .replace(/^esc$/, 'escape')

/**
 * The document writes chords the way a reader wants them, not the way a parser does, and all three
 * shorthands are load-bearing for its legibility:
 *
 * - `Mod+Alt+←` `→` — the second span is a continuation and inherits the first one's modifiers.
 * - `↑ ↓ ← →` — four bare keys in one span.
 * - `Mod+1` … `Mod+6` — a range, with the four entries between them left implied.
 */
const expand = (column: string): readonly string[] => {
  const spans = [...column.matchAll(/`([^`]+)`/g)].map((match) => match[1] ?? '')
  const keys: string[] = []
  let chord = ''

  for (const span of spans) {
    for (const token of span.split(/\s+/).filter(Boolean)) {
      const key = canonical(token)

      if (key.length === 0) continue

      if (key.includes('+')) {
        chord = key.slice(0, key.lastIndexOf('+') + 1)
        keys.push(key)
      } else {
        keys.push(chord + key)
      }
    }
  }

  if (!column.includes('…') || keys.length !== 2) return keys

  const [first = '', last = ''] = keys
  const from = Number(first.slice(first.lastIndexOf('+') + 1))
  const to = Number(last.slice(last.lastIndexOf('+') + 1))

  if (!Number.isInteger(from) || !Number.isInteger(to) || to <= from) return keys

  const prefix = first.slice(0, first.lastIndexOf('+') + 1)

  return Array.from({ length: to - from + 1 }, (_, index) => `${prefix}${from + index}`)
}

/** The first column of every table row, which is where the document puts the chord. */
const documentedKeys = (): readonly string[] => {
  const keys = new Set<string>()

  for (const line of DOCUMENT.split(/\r?\n/)) {
    if (!line.startsWith('|')) continue

    for (const key of expand(line.split('|')[1] ?? '')) {
      if (GESTURE.test(key) || HOLD.has(key)) continue

      keys.add(key)
    }
  }

  return [...keys]
}

describe('the studio registry', () => {
  it('builds without a conflict, which is the startup assertion', () => {
    expect(studioShortcuts.list().length).toBe(STUDIO_SHORTCUTS.length)
    expect(findConflicts(STUDIO_SHORTCUTS)).toEqual([])
  })

  it('registers exactly the keys SHORTCUTS.md documents, in both directions', () => {
    const registered = studioShortcuts.list().map((shortcut) => shortcut.keys)
    const documented = documentedKeys()

    expect(documented.filter((keys) => !registered.includes(keys))).toEqual([])
    expect(registered.filter((keys) => !documented.includes(keys))).toEqual([])
  })

  it('gives every entry a label, so the sheet and the palette can name it', () => {
    for (const shortcut of studioShortcuts.list()) {
      expect(shortcut.label.length, shortcut.id).toBeGreaterThan(0)
    }
  })

  it('throws when a second binding claims a key in the same scope', () => {
    const clash: StudioShortcut = {
      id: 'deliberate-conflict',
      keys: 'mod+k',
      label: 'Deliberate conflict',
      group: 'Global',
      scope: 'global',
      run: () => undefined,
    }

    expect(() => createShortcutRegistry([...STUDIO_SHORTCUTS, clash])).toThrow(
      ShortcutConflictError,
    )
    expect(() => createShortcutRegistry([...STUDIO_SHORTCUTS, clash])).toThrow(
      /mod\+k in global: command-palette, deliberate-conflict/,
    )
  })

  it('marks as delegated exactly the bindings a surface implements itself', () => {
    const delegated = studioShortcuts
      .list()
      .filter((shortcut) => shortcut.delegated === true)
      .map((shortcut) => shortcut.scope)

    // Nothing in the global scope is delegated except the focus cycle, which needs the live
    // activeElement — everything else global is centrally runnable.
    expect(delegated.filter((scope) => scope === 'global')).toEqual(['global'])
    expect(new Set(delegated)).toEqual(
      new Set(['global', 'canvas', 'layers', 'inspector', 'playground']),
    )
  })
})
