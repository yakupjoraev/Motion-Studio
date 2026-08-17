'use client'

import type { ThemeConfig } from '@motion-studio/theme'
import { useCallback, useEffect, useState } from 'react'

import {
  deleteCustomPreset,
  readCustomPresets,
  renameCustomPreset,
  saveCustomPreset,
} from './custom-presets'

export interface CustomPresets {
  readonly presets: readonly ThemeConfig[]
  readonly save: (config: ThemeConfig, name: string) => void
  readonly rename: (id: string, name: string) => void
  readonly remove: (id: string) => void
}

/**
 * The saved shelf, as React state over `localStorage`. Read in an effect rather than in the initial
 * state, because the panel is server-rendered and `localStorage` does not exist there — an initial read
 * would hydrate a different tree than it rendered.
 */
export function useCustomPresets(): CustomPresets {
  const [presets, setPresets] = useState<readonly ThemeConfig[]>([])

  useEffect(() => {
    setPresets(readCustomPresets())
  }, [])

  const save = useCallback((config: ThemeConfig, name: string) => {
    setPresets(saveCustomPreset(config, name))
  }, [])

  const rename = useCallback((id: string, name: string) => {
    setPresets(renameCustomPreset(id, name))
  }, [])

  const remove = useCallback((id: string) => {
    setPresets(deleteCustomPreset(id))
  }, [])

  return { presets, save, rename, remove }
}
