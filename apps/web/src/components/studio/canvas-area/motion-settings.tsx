'use client'

import { type ReactNode, createContext, useContext, useMemo, useSyncExternalStore } from 'react'

import { useStudioStore } from '../../../store/editor-store'

import { motionPlayback } from './motion-playback'

export interface MotionSettings {
  /** `theme.motionScale` — every duration is multiplied by it, and `0` is the reduced path (ADR-141). */
  readonly scale: number
  /** ADR-100: a paused document holds every animation at its settled state. */
  readonly paused: boolean
  /** Changes on every replay; the wrapper uses it as a key. */
  readonly replays: number
}

const MotionSettingsContext = createContext<MotionSettings>({
  scale: 1,
  paused: false,
  replays: 0,
})

/**
 * One subscription for the whole canvas rather than three per node. With two hundred nodes on
 * screen the difference is 600 store subscriptions against 2 — PERFORMANCE.md § Selector discipline
 * — and every node needs exactly the same three values.
 */
export function MotionSettingsProvider({ children }: { readonly children: ReactNode }) {
  const scale = useStudioStore((state) => state.document.theme.motionScale)
  const paused = useStudioStore((state) => state.viewport.motionPaused)
  const replays = useSyncExternalStore(motionPlayback.subscribe, motionPlayback.replays, () => 0)

  const value = useMemo<MotionSettings>(
    () => ({ scale, paused, replays }),
    [scale, paused, replays],
  )

  return <MotionSettingsContext.Provider value={value}>{children}</MotionSettingsContext.Provider>
}

export const useMotionSettings = (): MotionSettings => useContext(MotionSettingsContext)
