import { cn } from '@motion-studio/utils'
import { forwardRef, useSyncExternalStore } from 'react'

import { kbdStyles } from './kbd.styles'

import type { KbdPlatform, KbdProps } from './kbd.types'

// SHORTCUTS.md § Platform normalization. Unlisted tokens pass through unchanged.
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

/** `⌘` is announced as "place of interest sign". Off macOS the display is already words. */
const SPOKEN_MAC: Readonly<Record<string, string>> = {
  Mod: 'Command',
  Ctrl: 'Control',
  Alt: 'Option',
}

const translate = (token: string, table: Readonly<Record<string, string>>): string =>
  table[token] ?? (token.length === 1 ? token.toUpperCase() : token)

/** macOS concatenates glyphs; everywhere else spells the modifiers out and joins with `+`. */
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

/** `useSyncExternalStore` for the server snapshot: reading `navigator` in render breaks hydration. */
const useDetectedPlatform = (): KbdPlatform =>
  useSyncExternalStore(
    NEVER_CHANGES,
    () => (detectMac() ? 'mac' : 'other'),
    () => 'other',
  )

/** The label is macOS-only: elsewhere it would repeat the text it labels. */
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
