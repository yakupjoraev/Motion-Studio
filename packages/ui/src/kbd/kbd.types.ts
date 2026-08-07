import type { HTMLAttributes } from 'react'

/** Which display language to use. `SHORTCUTS.md` § Platform normalization has exactly these two. */
export type KbdPlatform = 'mac' | 'other'

export interface KbdProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /**
   * The shortcut in the registry's own notation — `Mod+Shift+Z`. `SHORTCUTS.md` § Platform normalization:
   * "`Mod` = `Cmd` on macOS, `Ctrl` elsewhere. Resolved at runtime; never hard-coded."
   */
  readonly keys: string
  /** Overrides detection. Present so a test, a story or a docs page can show the other platform's form. */
  readonly platform?: KbdPlatform
}
