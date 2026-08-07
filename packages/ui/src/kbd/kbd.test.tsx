import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { expectNoViolations } from '../test/axe'

import { Kbd, formatKeys, speakKeys } from './kbd'

afterEach(() => {
  vi.unstubAllGlobals()
})

/** jsdom reports `navigator.platform` as a Linux string, so a mac has to be stubbed in to be tested. */
const pretendMac = (): void => {
  vi.stubGlobal('navigator', { ...globalThis.navigator, platform: 'MacIntel' })
}

describe('formatKeys', () => {
  it.each([
    ['Mod+Z', '⌘Z'],
    ['Mod+Shift+Z', '⌘⇧Z'],
    ['Mod+Alt+V', '⌘⌥V'],
    ['Escape', '⎋'],
    ['Mod+]', '⌘]'],
    ['Mod+/', '⌘/'],
  ])('renders %s as %s on macOS', (keys, expected) => {
    expect(formatKeys(keys, 'mac')).toBe(expected)
  })

  it.each([
    ['Mod+Z', 'Ctrl+Z'],
    ['Mod+Shift+Z', 'Ctrl+Shift+Z'],
    ['Mod+Alt+V', 'Ctrl+Alt+V'],
    ['Escape', 'Esc'],
    ['Mod+]', 'Ctrl+]'],
  ])('renders %s as %s elsewhere', (keys, expected) => {
    expect(formatKeys(keys, 'other')).toBe(expected)
  })

  it('upper-cases a single character but leaves a named key alone', () => {
    expect(formatKeys('Mod+z', 'other')).toBe('Ctrl+Z')
    expect(formatKeys('Mod+Backspace', 'other')).toBe('Ctrl+Backspace')
  })

  it('passes an unknown token straight through, so a new key needs no table entry', () => {
    expect(formatKeys('F2', 'other')).toBe('F2')
    expect(formatKeys('Mod+F2', 'mac')).toBe('⌘F2')
  })

  it('survives a stray separator rather than emitting an empty key', () => {
    expect(formatKeys('Mod++', 'other')).toBe('Ctrl')
    expect(formatKeys('', 'other')).toBe('')
  })
})

describe('speakKeys', () => {
  it('spells the modifiers out, because a glyph is not a word', () => {
    expect(speakKeys('Mod+Shift+Z')).toBe('Command Shift Z')
    expect(speakKeys('Mod+Alt+V')).toBe('Command Option V')
  })
})

describe('Kbd', () => {
  it('renders a kbd element carrying the shortcut', () => {
    render(<Kbd keys="Mod+Z" platform="other" />)

    expect(screen.getByText('Ctrl+Z').tagName).toBe('KBD')
  })

  it('takes the platform from the environment when the caller names none', () => {
    render(<Kbd keys="Mod+Z" />)

    // jsdom is not a mac, and the server snapshot is `other` too — see the store in `kbd.tsx`.
    expect(screen.getByText('Ctrl+Z')).toBeInTheDocument()
  })

  it('detects a mac and switches to glyphs', () => {
    pretendMac()

    render(<Kbd keys="Mod+Z" />)

    expect(screen.getByText('⌘Z')).toBeInTheDocument()
  })

  it('labels the glyphs, which no screen reader reads as keys', () => {
    render(<Kbd keys="Mod+Shift+Z" platform="mac" />)

    expect(screen.getByLabelText('Command Shift Z')).toBeInTheDocument()
  })

  it('adds no label off macOS, where the display is already the words', () => {
    render(<Kbd keys="Mod+Shift+Z" platform="other" />)

    expect(screen.getByText('Ctrl+Shift+Z')).not.toHaveAttribute('aria-label')
  })

  it('is not a button: no ring, no press, no hover state', () => {
    // A key cap labels a key on the user's keyboard. Looking pressable would promise something it is not.
    render(<Kbd keys="Mod+Z" platform="other" />)

    const className = screen.getByText('Ctrl+Z').className

    expect(className).not.toContain('shadow-focus')
    expect(className).not.toContain('active:')
    expect(className).not.toContain('hover:')
  })

  it('spreads unknown props to its root', () => {
    render(<Kbd keys="Mod+Z" platform="other" data-testid="hint" />)

    expect(screen.getByTestId('hint')).toBeInTheDocument()
  })

  it('forwards its ref', () => {
    const ref = { current: null as HTMLElement | null }
    render(<Kbd ref={ref} keys="Mod+Z" platform="other" />)

    expect(ref.current).toBe(screen.getByText('Ctrl+Z'))
  })

  it('is axe clean', async () => {
    const { container } = render(<Kbd keys="Mod+Shift+Z" platform="mac" />)

    await expectNoViolations(container)
  })
})
