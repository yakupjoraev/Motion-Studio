import { themeConfigSchema } from '@motion-studio/theme'
import { MotionStudioError, getPath, humanize, setPath } from '@motion-studio/utils'

import type { Command } from './command.types'

export const INVALID_THEME_TOKEN = 'INVALID_THEME_TOKEN'

export interface SetThemeTokenPayload {
  /** A dot path into `ThemeConfig`: `palette.accent`, `radiusScale`, `surface.glassLevel`. */
  readonly path: string
  readonly value: unknown
}

/**
 * STATE_MANAGEMENT.md § Command catalogue. The theme lives in the document, so a token edit is an
 * ordinary undoable command with the coalesce key `theme:{path}` — a hue drag is one undo step.
 *
 * Two checks, because they catch different mistakes and one does not imply the other:
 *
 * 1. **The path must already exist.** Every field of `ThemeConfig` is required, so a path that reads
 *    as `undefined` is a typo, and `setPath` would otherwise create `theme.raduisScale` — a write
 *    that succeeds, validates, and produces a control that silently stops working.
 * 2. **The config must still parse.** `radiusScale: 7` is a real path with an impossible value, and
 *    the theme engine would resolve it into a stylesheet nobody can trace back to here.
 *
 * A schema parse alone does not do the first: `themeConfigSchema` is a plain object schema, so it
 * strips the unknown key and reports success.
 */
export function setThemeToken(payload: SetThemeTokenPayload): Command<SetThemeTokenPayload> {
  return {
    type: 'setThemeToken',
    label: `Set ${humanize(payload.path)}`,
    payload,
    coalesceKey: `theme:${payload.path}`,
    apply(draft) {
      if (getPath(draft.theme, payload.path) === undefined) {
        throw new MotionStudioError(`Unknown theme token: ${payload.path}`, INVALID_THEME_TOKEN)
      }

      setPath(draft.theme, payload.path, payload.value)

      const parsed = themeConfigSchema.safeParse(draft.theme)

      if (!parsed.success) {
        throw new MotionStudioError(
          `Not a valid value for theme token ${payload.path}`,
          INVALID_THEME_TOKEN,
          parsed.error,
        )
      }
    },
  }
}
