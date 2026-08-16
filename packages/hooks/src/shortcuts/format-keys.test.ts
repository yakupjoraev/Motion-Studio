import { describe, expect, it } from 'vitest'

import { formatKeyParts, formatKeys } from './format-keys'

describe('formatKeys', () => {
  it('writes glyphs on macOS and words elsewhere', () => {
    expect(formatKeys('mod+shift+z', 'mac')).toBe('⇧⌘Z')
    expect(formatKeys('mod+shift+z', 'other')).toBe('Ctrl+Shift+Z')
  })

  it('follows the macOS glyph order, command last', () => {
    expect(formatKeyParts('mod+alt+shift+k', 'mac')).toEqual(['⌥', '⇧', '⌘', 'K'])
    expect(formatKeyParts('mod+alt+shift+k', 'other')).toEqual(['Ctrl', 'Alt', 'Shift', 'K'])
  })

  it('names the keys that are words rather than characters', () => {
    expect(formatKeys('shift+up', 'other')).toBe('Shift+↑')
    expect(formatKeys('backspace', 'mac')).toBe('⌫')
    expect(formatKeys('backspace', 'other')).toBe('Backspace')
    expect(formatKeys('escape', 'other')).toBe('Esc')
    expect(formatKeys('f2', 'other')).toBe('F2')
  })

  it('keeps punctuation as it is typed', () => {
    expect(formatKeys('mod+/', 'other')).toBe('Ctrl+/')
    expect(formatKeys("mod+shift+'", 'mac')).toBe("⇧⌘'")
    expect(formatKeys('mod+\\', 'other')).toBe('Ctrl+\\')
    expect(formatKeys('mod+=', 'other')).toBe('Ctrl+=')
  })

  it('shows the platform difference the sheet is judged on', () => {
    expect(formatKeys('mod+k', 'mac')).toBe('⌘K')
    expect(formatKeys('mod+k', 'other')).toBe('Ctrl+K')
  })
})
