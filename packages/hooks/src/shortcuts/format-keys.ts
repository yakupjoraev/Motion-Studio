import { type ModifierName, type Platform, currentPlatform, parseKeys } from './normalize-keys'

/**
 * SHORTCUTS.md § Platform normalization: `⌘⇧Z` on macOS, `Ctrl+Shift+Z` elsewhere, in tooltips, the
 * palette and the reference sheet. The parts come back as an array because a `<kbd>` per key reads
 * as keys, and a single string reads as text.
 */
const MAC_MODIFIERS: Readonly<Record<ModifierName, string>> = {
  mod: '⌘',
  meta: '⌘',
  ctrl: '⌃',
  alt: '⌥',
  shift: '⇧',
}

const OTHER_MODIFIERS: Readonly<Record<ModifierName, string>> = {
  mod: 'Ctrl',
  meta: 'Win',
  ctrl: 'Ctrl',
  alt: 'Alt',
  shift: 'Shift',
}

/** Names for keys whose canonical form is a word rather than a character. */
const MAC_KEYS: Readonly<Record<string, string>> = {
  up: '↑',
  down: '↓',
  left: '←',
  right: '→',
  enter: '↩',
  escape: 'Esc',
  space: 'Space',
  backspace: '⌫',
  delete: '⌦',
  tab: '⇥',
  pageup: '⇞',
  pagedown: '⇟',
  home: '↖',
  end: '↘',
}

const OTHER_KEYS: Readonly<Record<string, string>> = {
  up: '↑',
  down: '↓',
  left: '←',
  right: '→',
  enter: 'Enter',
  escape: 'Esc',
  space: 'Space',
  backspace: 'Backspace',
  delete: 'Delete',
  tab: 'Tab',
  pageup: 'Page Up',
  pagedown: 'Page Down',
  home: 'Home',
  end: 'End',
}

const MODIFIER_DISPLAY_ORDER: readonly ModifierName[] = ['mod', 'ctrl', 'meta', 'alt', 'shift']

/** macOS prints the glyphs in its own order — control, option, shift, command — and command last. */
const MAC_DISPLAY_ORDER: readonly ModifierName[] = ['ctrl', 'alt', 'shift', 'mod', 'meta']

function displayKey(key: string, platform: Platform): string {
  const named = platform === 'mac' ? MAC_KEYS[key] : OTHER_KEYS[key]

  if (named !== undefined) {
    return named
  }

  if (/^f([1-9]|1[0-2])$/.test(key)) {
    return key.toUpperCase()
  }

  return key.length === 1 ? key.toUpperCase() : key
}

export function formatKeyParts(
  declaration: string,
  platform: Platform = currentPlatform(),
): readonly string[] {
  const { modifiers, key } = parseKeys(declaration)
  const order = platform === 'mac' ? MAC_DISPLAY_ORDER : MODIFIER_DISPLAY_ORDER
  const table = platform === 'mac' ? MAC_MODIFIERS : OTHER_MODIFIERS

  const parts = order.filter((name) => modifiers.has(name)).map((name) => table[name])

  return key === '' ? parts : [...parts, displayKey(key, platform)]
}

/** macOS runs the glyphs together (`⌘⇧Z`); everywhere else the parts are joined with `+`. */
export function formatKeys(declaration: string, platform: Platform = currentPlatform()): string {
  const parts = formatKeyParts(declaration, platform)

  return platform === 'mac' ? parts.join('') : parts.join('+')
}
