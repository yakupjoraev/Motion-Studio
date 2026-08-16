import { ShortcutConflictError, createShortcutRegistry, findConflicts } from '@motion-studio/hooks'
import { describe, expect, it } from 'vitest'

import type { StudioShortcut } from './shortcut.types'
import { STUDIO_SHORTCUTS, studioShortcuts } from './studio-registry'

/** Every table row of SHORTCUTS.md that names a key. Pointer gestures are the canvas's, not bindings. */
const DOCUMENTED_KEYS = [
  'mod+k',
  'mod+z',
  'mod+shift+z',
  'mod+y',
  'mod+s',
  'mod+o',
  'mod+shift+e',
  'mod+,',
  'mod+/',
  'mod+\\',
  'mod+alt+\\',
  'mod+.',
  'f2',
  'escape',
  'mod+a',
  'mod+shift+a',
  'tab',
  'shift+tab',
  'enter',
  'mod+shift+up',
  'mod+shift+down',
  'mod+d',
  'mod+c',
  'mod+x',
  'mod+v',
  'mod+shift+v',
  'mod+alt+v',
  'delete',
  'backspace',
  'mod+g',
  'mod+shift+g',
  'mod+shift+h',
  'mod+shift+l',
  'mod+]',
  'mod+[',
  'mod+alt+]',
  'mod+alt+[',
  'up',
  'down',
  'left',
  'right',
  'shift+up',
  'shift+down',
  'alt+up',
  'alt+down',
  'mod+alt+left',
  'mod+alt+right',
  'mod+alt+up',
  'mod+alt+down',
  'alt+a',
  'alt+d',
  'alt+h',
  'alt+w',
  'alt+s',
  'alt+v',
  'alt+shift+h',
  'alt+shift+v',
  'space',
  'mod+=',
  'mod+-',
  'mod+0',
  'shift+1',
  'shift+2',
  "mod+'",
  "mod+shift+'",
  'mod+r',
  'mod+p',
  'mod+shift+p',
  'mod+1',
  'mod+2',
  'mod+3',
  'mod+4',
  'mod+5',
  'mod+6',
  'mod+shift+m',
  'alt+1',
  'alt+2',
  'alt+3',
  'alt+4',
  'alt+5',
  'mod+f',
  'mod+shift+f',
  'mod+backspace',
  'alt+backspace',
  'mod+up',
  'mod+down',
  'mod+enter',
  'mod+shift+s',
  'mod+shift+c',
  'mod+shift+k',
] as const

describe('the studio registry', () => {
  it('builds without a conflict, which is the startup assertion', () => {
    expect(studioShortcuts.list().length).toBe(STUDIO_SHORTCUTS.length)
    expect(findConflicts(STUDIO_SHORTCUTS)).toEqual([])
  })

  it('registers every key SHORTCUTS.md documents', () => {
    const registered = new Set(studioShortcuts.list().map((shortcut) => shortcut.keys))
    const missing = DOCUMENTED_KEYS.filter((keys) => !registered.has(keys))

    expect(missing).toEqual([])
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
