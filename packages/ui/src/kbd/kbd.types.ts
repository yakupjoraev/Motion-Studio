import type { HTMLAttributes } from 'react'

/** Which display language to use. `SHORTCUTS.md` § Platform normalization has exactly these two. */
export type KbdPlatform = 'mac' | 'other'

export interface KbdProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** The registry's notation — `Mod+Shift+Z`. `Mod` resolves at runtime, never hard-coded. */
  readonly keys: string
  /** Overrides detection, so a story or a docs page can show the other platform. */
  readonly platform?: KbdPlatform
}
