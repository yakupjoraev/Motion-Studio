import { describe, expect, it } from 'vitest'

import { canonicalKeys, detectPlatform, normalizeKeys, parseKeys } from './normalize-keys'

interface EventShape {
  key: string
  code?: string
  ctrlKey?: boolean
  metaKey?: boolean
  altKey?: boolean
  shiftKey?: boolean
}

const event = (shape: EventShape): KeyboardEvent =>
  ({
    key: shape.key,
    code: shape.code ?? '',
    ctrlKey: shape.ctrlKey ?? false,
    metaKey: shape.metaKey ?? false,
    altKey: shape.altKey ?? false,
    shiftKey: shape.shiftKey ?? false,
  }) as KeyboardEvent

describe('detectPlatform', () => {
  it.each([
    ['MacIntel', 'mac'],
    ['iPhone', 'mac'],
    ['Win32', 'other'],
    ['Linux x86_64', 'other'],
  ])('reads %s as %s', (platform, expected) => {
    expect(detectPlatform({ platform })).toBe(expected)
  })

  it('falls back to the user agent when the platform string is empty', () => {
    expect(detectPlatform({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' })).toBe(
      'mac',
    )
  })

  it('is not a mac when nothing is known', () => {
    expect(detectPlatform(undefined)).toBe('other')
  })
})

describe('normalizeKeys — mod is the platform key', () => {
  it('maps meta to mod on macOS and ctrl to a separate modifier', () => {
    expect(normalizeKeys(event({ key: 'z', code: 'KeyZ', metaKey: true }), 'mac')).toBe('mod+z')
    expect(normalizeKeys(event({ key: 'z', code: 'KeyZ', ctrlKey: true }), 'mac')).toBe('ctrl+z')
  })

  it('maps ctrl to mod elsewhere and meta to a separate modifier', () => {
    expect(normalizeKeys(event({ key: 'z', code: 'KeyZ', ctrlKey: true }), 'other')).toBe('mod+z')
    expect(normalizeKeys(event({ key: 'z', code: 'KeyZ', metaKey: true }), 'other')).toBe('meta+z')
  })

  it('writes the modifiers in canonical order whatever order they arrive in', () => {
    const both = event({ key: 'Z', code: 'KeyZ', ctrlKey: true, altKey: true, shiftKey: true })

    expect(normalizeKeys(both, 'other')).toBe('mod+alt+shift+z')
  })

  it.each([
    [{ ctrlKey: true }, 'mod+d'],
    [{ ctrlKey: true, shiftKey: true }, 'mod+shift+d'],
    [{ ctrlKey: true, altKey: true }, 'mod+alt+d'],
    [{ altKey: true }, 'alt+d'],
    [{ altKey: true, shiftKey: true }, 'alt+shift+d'],
    [{ shiftKey: true }, 'shift+d'],
    [{}, 'd'],
  ])('covers modifier combination %o', (modifiers, expected) => {
    expect(normalizeKeys(event({ key: 'd', code: 'KeyD', ...modifiers }), 'other')).toBe(expected)
  })

  it('never resolves a modifier pressed on its own', () => {
    expect(normalizeKeys(event({ key: 'Shift', code: 'ShiftLeft', shiftKey: true }), 'other')).toBe(
      '',
    )
    expect(normalizeKeys(event({ key: 'Meta', code: 'MetaLeft', metaKey: true }), 'mac')).toBe('')
  })
})

describe('normalizeKeys — code decides the key (ADR-145)', () => {
  it.each([
    ['ArrowUp', 'up'],
    ['ArrowDown', 'down'],
    ['ArrowLeft', 'left'],
    ['ArrowRight', 'right'],
    ['Space', 'space'],
    ['Escape', 'escape'],
    ['Enter', 'enter'],
    ['NumpadEnter', 'enter'],
    ['Backspace', 'backspace'],
    ['Delete', 'delete'],
    ['Tab', 'tab'],
    ['F2', 'f2'],
    ['F12', 'f12'],
  ])('reads the physical key %s as %s', (code, expected) => {
    expect(normalizeKeys(event({ key: 'ignored', code }), 'other')).toBe(expected)
  })

  it.each([
    ['Quote', "'"],
    ['Slash', '/'],
    ['Backslash', '\\'],
    ['BracketLeft', '['],
    ['BracketRight', ']'],
    ['Comma', ','],
    ['Period', '.'],
    ['Minus', '-'],
    ['Equal', '='],
  ])('reads the punctuation key %s as %s regardless of shift', (code, expected) => {
    expect(normalizeKeys(event({ key: '?', code, shiftKey: true }), 'other')).toBe(
      `shift+${expected}`,
    )
  })

  it('survives an AZERTY layout, where the letters and digits print differently', () => {
    // AZERTY: the key at `KeyA` types "q", and `Digit1` types "&" without shift.
    const selectAll = event({ key: 'q', code: 'KeyA', ctrlKey: true })
    const baseBreakpoint = event({ key: '&', code: 'Digit1', ctrlKey: true })

    expect(normalizeKeys(selectAll, 'other')).toBe('mod+a')
    expect(normalizeKeys(baseBreakpoint, 'other')).toBe('mod+1')
  })

  it('survives a layout whose letters are not latin', () => {
    expect(normalizeKeys(event({ key: 'я', code: 'KeyZ', ctrlKey: true }), 'other')).toBe('mod+z')
  })

  it('keeps arrow navigation working on AZERTY', () => {
    expect(normalizeKeys(event({ key: 'ArrowRight', code: 'ArrowRight', shiftKey: true }))).toBe(
      'shift+right',
    )
  })

  it('falls back to the typed character when no code arrives', () => {
    expect(normalizeKeys(event({ key: 'K', ctrlKey: true }), 'other')).toBe('mod+k')
    expect(normalizeKeys(event({ key: ' ' }), 'other')).toBe('space')
  })
})

describe('parseKeys', () => {
  it('keeps a key that is itself a plus sign', () => {
    expect(parseKeys('mod+=')).toEqual({ modifiers: new Set(['mod']), key: '=' })
    expect(parseKeys('mod++')).toEqual({ modifiers: new Set(['mod']), key: '+' })
  })

  it('accepts the aliases a declaration might be written with', () => {
    expect(canonicalKeys('Cmd+Shift+Z')).toBe('mod+shift+z')
    expect(canonicalKeys('Control+Option+Left')).toBe('ctrl+alt+left')
  })

  it('is idempotent, so a canonical string survives a second pass', () => {
    expect(canonicalKeys(canonicalKeys('Shift+Mod+Z'))).toBe('mod+shift+z')
  })

  it('orders modifiers canonically whatever order they were declared in', () => {
    expect(canonicalKeys('shift+alt+mod+k')).toBe(canonicalKeys('mod+alt+shift+k'))
  })
})
