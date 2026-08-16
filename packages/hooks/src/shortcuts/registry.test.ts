import { describe, expect, it, vi } from 'vitest'

import {
  DuplicateShortcutIdError,
  type Shortcut,
  ShortcutConflictError,
  createShortcutRegistry,
  findConflicts,
} from './registry'

interface Ctx {
  readonly hasSelection: boolean
}

const shortcut = (
  partial: Partial<Shortcut<Ctx>> & Pick<Shortcut<Ctx>, 'id' | 'keys'>,
): Shortcut<Ctx> => ({
  label: partial.id,
  group: 'Global',
  scope: 'global',
  run: vi.fn(),
  ...partial,
})

describe('createShortcutRegistry', () => {
  it('canonicalises declarations, so modifier order in the source is free', () => {
    const registry = createShortcutRegistry<Ctx>([shortcut({ id: 'redo', keys: 'Shift+Mod+Z' })])

    expect(registry.get('redo')?.keys).toBe('mod+shift+z')
    expect(registry.match('mod+shift+z', 'global')).toHaveLength(1)
  })

  it('returns the scope match before the global one', () => {
    const registry = createShortcutRegistry<Ctx>([
      shortcut({ id: 'cycle-panels', keys: 'f2', scope: 'global' }),
      shortcut({ id: 'rename-layer', keys: 'f2', scope: 'layers' }),
    ])

    expect(registry.match('f2', 'layers').map((one) => one.id)).toEqual([
      'rename-layer',
      'cycle-panels',
    ])
  })

  it('consults nothing but the dialog scope while a dialog owns the keyboard', () => {
    const registry = createShortcutRegistry<Ctx>([
      shortcut({ id: 'undo', keys: 'mod+z', scope: 'global' }),
      shortcut({ id: 'close', keys: 'escape', scope: 'dialog' }),
    ])

    expect(registry.match('mod+z', 'dialog')).toEqual([])
    expect(registry.match('escape', 'dialog').map((one) => one.id)).toEqual(['close'])
  })

  it('groups for the reference sheet', () => {
    const registry = createShortcutRegistry<Ctx>([
      shortcut({ id: 'undo', keys: 'mod+z', group: 'Global' }),
      shortcut({ id: 'nudge', keys: 'up', group: 'Transform' }),
    ])

    expect(registry.byGroup('Transform').map((one) => one.id)).toEqual(['nudge'])
  })
})

describe('the conflict assertion (ADR-146)', () => {
  it('throws when two shortcuts claim the same keys in the same scope', () => {
    const deliberate = [
      shortcut({ id: 'duplicate', keys: 'mod+d', scope: 'canvas' }),
      shortcut({ id: 'delete-node', keys: 'Mod+D', scope: 'canvas' }),
    ]

    expect(() => createShortcutRegistry<Ctx>(deliberate)).toThrow(ShortcutConflictError)
    expect(() => createShortcutRegistry<Ctx>(deliberate)).toThrow(/mod\+d in canvas/)
  })

  it('names both offenders, so the message is actionable', () => {
    const conflicts = findConflicts<Ctx>([
      shortcut({ id: 'a', keys: 'mod+k' }),
      shortcut({ id: 'b', keys: 'mod+k' }),
    ])

    expect(conflicts).toEqual([{ keys: 'mod+k', scope: 'global', ids: ['a', 'b'] }])
  })

  it('accepts the same keys in different scopes: that is an override', () => {
    expect(
      findConflicts<Ctx>([
        shortcut({ id: 'pan', keys: 'space', scope: 'canvas' }),
        shortcut({ id: 'toggle-row', keys: 'space', scope: 'layers' }),
      ]),
    ).toEqual([])
  })

  it('accepts a scope shadowing global, which is what resolution is for', () => {
    expect(
      findConflicts<Ctx>([
        shortcut({ id: 'cycle-panels', keys: 'f2', scope: 'global' }),
        shortcut({ id: 'rename-layer', keys: 'f2', scope: 'layers' }),
      ]),
    ).toEqual([])
  })

  it('throws on a duplicate id before it throws on keys', () => {
    expect(() =>
      createShortcutRegistry<Ctx>([
        shortcut({ id: 'undo', keys: 'mod+z' }),
        shortcut({ id: 'undo', keys: 'mod+y' }),
      ]),
    ).toThrow(DuplicateShortcutIdError)
  })
})
