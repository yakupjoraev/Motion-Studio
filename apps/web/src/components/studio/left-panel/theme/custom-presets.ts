'use client'

import { type ThemeConfig, themeConfigSchema } from '@motion-studio/theme'
import { createId } from '@motion-studio/utils'

/**
 * Saved presets — `THEME_ENGINE.md` § Theme builder UI. They live in `localStorage` rather than in the
 * document because they are a user-level convenience: a designer's shelf of palettes, not content the
 * `.motion` file has to carry to another machine.
 *
 * Everything read back is parsed. A stored config is untrusted input — hand-edited, or written by a
 * build that predates a field — and the schema's defaults are what make an older entry usable rather
 * than discarded.
 */

export const STORAGE_KEY = 'motion-studio.theme.presets'

const parseList = (raw: unknown): ThemeConfig[] => {
  if (!Array.isArray(raw)) {
    return []
  }

  return raw.flatMap((entry) => {
    const parsed = themeConfigSchema.safeParse(entry)

    return parsed.success ? [parsed.data] : []
  })
}

export function readCustomPresets(): readonly ThemeConfig[] {
  if (typeof window === 'undefined') {
    return []
  }

  const stored = window.localStorage.getItem(STORAGE_KEY)

  if (stored === null) {
    return []
  }

  // A corrupt entry costs the shelf, not the studio: the panel still opens, with no saved presets.
  try {
    return parseList(JSON.parse(stored))
  } catch {
    return []
  }
}

const write = (presets: readonly ThemeConfig[]): readonly ThemeConfig[] => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(presets))

  return presets
}

/** Saves the current config under a new id, so editing the theme afterwards does not edit the preset. */
export function saveCustomPreset(config: ThemeConfig, name: string): readonly ThemeConfig[] {
  return write([...readCustomPresets(), { ...config, id: createId('theme'), name }])
}

export function renameCustomPreset(id: string, name: string): readonly ThemeConfig[] {
  return write(
    readCustomPresets().map((preset) => (preset.id === id ? { ...preset, name } : preset)),
  )
}

export function deleteCustomPreset(id: string): readonly ThemeConfig[] {
  return write(readCustomPresets().filter((preset) => preset.id !== id))
}
