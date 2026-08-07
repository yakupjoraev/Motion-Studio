import { cn } from '@motion-studio/utils'
import { forwardRef, useSyncExternalStore } from 'react'

import { kbdStyles } from './kbd.styles'

import type { KbdPlatform, KbdProps } from './kbd.types'

/**
 * The two display languages of `SHORTCUTS.md` § Platform normalization: "`⌘⇧Z` on macOS, `Ctrl+Shift+Z`
 * elsewhere". Only the tokens the shortcut tables actually use are listed; anything else passes through, so
 * `Mod+]` renders its bracket and a future `F2` renders itself.
 */
const MAC: Readonly<Record<string, string>> = {
  Mod: '⌘',
  Ctrl: '⌃',
  Alt: '⌥',
  Shift: '⇧',
  Enter: '↵',
  Backspace: '⌫',
  Delete: '⌦',
  Escape: '⎋',
  Esc: '⎋',
  Tab: '⇥',
  Space: '␣',
}

const OTHER: Readonly<Record<string, string>> = {
  Mod: 'Ctrl',
  Escape: 'Esc',
}

/**
 * What a screen reader should say on macOS, where the display is glyphs — `⌘` is announced as "place of
 * interest sign", which helps nobody. Everywhere else the display is already words and needs no second form.
 */
const SPOKEN_MAC: Readonly<Record<string, string>> = {
  Mod: 'Command',
  Ctrl: 'Control',
  Alt: 'Option',
}

const translate = (token: string, table: Readonly<Record<string, string>>): string =>
  table[token] ?? (token.length === 1 ? token.toUpperCase() : token)

/**
 * macOS concatenates its glyphs — `⌘⇧Z` is one visual unit — while every other platform spells the
 * modifiers out and joins them with `+`. That difference is the whole component.
 */
export const formatKeys = (keys: string, platform: KbdPlatform): string => {
  const tokens = keys.split('+').filter((token) => token.length > 0)

  return platform === 'mac'
    ? tokens.map((token) => translate(token, MAC)).join('')
    : tokens.map((token) => translate(token, OTHER)).join('+')
}

/** The macOS shortcut in words: "Command Shift Z" rather than three glyphs. */
export const speakKeys = (keys: string): string =>
  keys
    .split('+')
    .filter((token) => token.length > 0)
    .map((token) => translate(token, SPOKEN_MAC))
    .join(' ')

const NEVER_CHANGES = (): (() => void) => () => undefined

const detectMac = (): boolean => /mac|iphone|ipad|ipod/i.test(globalThis.navigator.platform)

/**
 * Read through `useSyncExternalStore` rather than in render: the server has no `navigator`, and the server
 * snapshot below is what keeps the first client render identical to the markup it hydrates. The store never
 * emits — the platform does not change under a running tab — so the subscribe function is a no-op.
 */
const useDetectedPlatform = (): KbdPlatform =>
  useSyncExternalStore(
    NEVER_CHANGES,
    () => (detectMac() ? 'mac' : 'other'),
    () => 'other',
  )

/**
 * A key cap showing a shortcut in the current platform's language.
 *
 * The label is set on macOS only. There the display is glyphs and a screen reader needs words; everywhere
 * else the display is already the words, and an `aria-label` repeating the text it labels is noise.
 */
export const Kbd = forwardRef<HTMLElement, KbdProps>(function Kbd(
  { keys, platform, className, ...rest },
  ref,
) {
  const detected = useDetectedPlatform()
  const resolved = platform ?? detected

  return (
    <kbd
      ref={ref}
      className={cn(kbdStyles(), className)}
      {...(resolved === 'mac' ? { 'aria-label': speakKeys(keys) } : {})}
      {...rest}
    >
      {formatKeys(keys, resolved)}
    </kbd>
  )
})
