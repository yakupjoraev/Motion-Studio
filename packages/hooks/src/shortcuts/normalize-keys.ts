/**
 * SHORTCUTS.md § Platform normalization. One canonical string per key combination, produced from a
 * `KeyboardEvent` and from a written declaration alike, so `'Mod+Shift+Z'` in the registry and the
 * event a user generates on either platform meet as the same value.
 *
 * The `code`/`key` split is the part that matters. A physical key — an arrow, `Space`, `F2` — is
 * identified by where it sits on the keyboard, because arrow navigation must survive a layout that
 * puts different characters on those keys. A character key is identified by the character it
 * produced, because `Mod+Z` means the key that types a "z", wherever the layout keeps it.
 */

/** `mod` first, then the platform's secondary modifier, then `alt`, then `shift`. */
const MODIFIER_ORDER = ['mod', 'meta', 'ctrl', 'alt', 'shift'] as const

export type ModifierName = (typeof MODIFIER_ORDER)[number]

export type Platform = 'mac' | 'other'

/** `event.code` values whose meaning is the position, not the character printed on the cap. */
const PHYSICAL_CODES: Readonly<Record<string, string>> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  Space: 'space',
  Enter: 'enter',
  NumpadEnter: 'enter',
  Escape: 'escape',
  Tab: 'tab',
  Backspace: 'backspace',
  Delete: 'delete',
  Home: 'home',
  End: 'end',
  PageUp: 'pageup',
  PageDown: 'pagedown',
}

const FUNCTION_CODE_RE = /^F([1-9]|1[0-2])$/

/**
 * The character a code prints on a US layout. ADR-145: a binding names a key by its position and
 * spells it with the character a reader recognises, so `Mod+Z` is the key left of `X` on every
 * layout — including the ones where that key types `я` or `w`.
 */
const CHARACTER_CODES: Readonly<Record<string, string>> = {
  Minus: '-',
  Equal: '=',
  BracketLeft: '[',
  BracketRight: ']',
  Backslash: '\\',
  Semicolon: ';',
  Quote: "'",
  Backquote: '`',
  Comma: ',',
  Period: '.',
  Slash: '/',
  NumpadAdd: '+',
  NumpadSubtract: '-',
  NumpadDivide: '/',
  NumpadMultiply: '*',
  NumpadDecimal: '.',
}

const LETTER_CODE_RE = /^Key([A-Z])$/
const DIGIT_CODE_RE = /^(?:Digit|Numpad)([0-9])$/

/** The modifier keys themselves never resolve to a shortcut — they are the prefix, not the key. */
const MODIFIER_KEYS = new Set(['Control', 'Meta', 'Alt', 'Shift', 'CapsLock'])

interface PlatformProbe {
  readonly platform?: string
  readonly userAgent?: string
}

/**
 * `navigator.platform` is deprecated and still the only thing every engine agrees on, so both it and
 * the user agent are consulted. A caller that knows better passes the platform in instead.
 */
export function detectPlatform(probe: PlatformProbe | undefined): Platform {
  const haystack = `${probe?.platform ?? ''} ${probe?.userAgent ?? ''}`

  return /mac|iphone|ipad|ipod/i.test(haystack) ? 'mac' : 'other'
}

export function currentPlatform(): Platform {
  return typeof navigator === 'undefined' ? 'other' : detectPlatform(navigator)
}

export interface ParsedKeys {
  readonly modifiers: ReadonlySet<ModifierName>
  readonly key: string
}

const MODIFIER_ALIASES: Readonly<Record<string, ModifierName>> = {
  mod: 'mod',
  cmd: 'mod',
  command: 'mod',
  meta: 'meta',
  ctrl: 'ctrl',
  control: 'ctrl',
  alt: 'alt',
  option: 'alt',
  opt: 'alt',
  shift: 'shift',
}

/**
 * Splitting on `+` would destroy `mod+=` and `mod++`, both of which are real bindings, so modifiers
 * are consumed from the front of the string and whatever is left is the key.
 */
export function parseKeys(declaration: string): ParsedKeys {
  const modifiers = new Set<ModifierName>()
  let rest = declaration.trim().toLowerCase()

  for (;;) {
    const plus = rest.indexOf('+')

    if (plus <= 0) {
      break
    }

    const candidate = MODIFIER_ALIASES[rest.slice(0, plus)]

    if (candidate === undefined) {
      break
    }

    modifiers.add(candidate)
    rest = rest.slice(plus + 1)
  }

  return { modifiers, key: rest }
}

function joinKeys({ modifiers, key }: ParsedKeys): string {
  const prefix = MODIFIER_ORDER.filter((name) => modifiers.has(name))

  return [...prefix, key].join('+')
}

/** Canonical form of a written declaration: `'Shift+Mod+Z'` and `'mod+shift+z'` are one binding. */
export function canonicalKeys(declaration: string): string {
  return joinKeys(parseKeys(declaration))
}

function eventKeyName(event: KeyboardEvent): string {
  const code = event.code

  const physical = PHYSICAL_CODES[code]

  if (physical !== undefined) {
    return physical
  }

  if (FUNCTION_CODE_RE.test(code)) {
    return code.toLowerCase()
  }

  const letter = LETTER_CODE_RE.exec(code)

  if (letter?.[1] !== undefined) {
    return letter[1].toLowerCase()
  }

  const digit = DIGIT_CODE_RE.exec(code)

  if (digit?.[1] !== undefined) {
    return digit[1]
  }

  const character = CHARACTER_CODES[code]

  if (character !== undefined) {
    return character
  }

  // No usable code: a synthetic event, an IME, or an on-screen keyboard. What the key typed is then
  // the only thing there is, and it is right often enough to be the fallback rather than a failure.
  return event.key === ' ' ? 'space' : event.key.toLowerCase()
}

/**
 * The empty string for a modifier key pressed on its own: nothing can be bound to it, and returning
 * a match for `'shift'` would let a shortcut fire while the user was still reaching for the letter.
 */
export function normalizeKeys(
  event: KeyboardEvent,
  platform: Platform = currentPlatform(),
): string {
  if (MODIFIER_KEYS.has(event.key)) {
    return ''
  }

  const modifiers = new Set<ModifierName>()

  if (platform === 'mac') {
    if (event.metaKey) {
      modifiers.add('mod')
    }

    if (event.ctrlKey) {
      modifiers.add('ctrl')
    }
  } else {
    if (event.ctrlKey) {
      modifiers.add('mod')
    }

    if (event.metaKey) {
      modifiers.add('meta')
    }
  }

  if (event.altKey) {
    modifiers.add('alt')
  }

  if (event.shiftKey) {
    modifiers.add('shift')
  }

  return joinKeys({ modifiers, key: eventKeyName(event) })
}
