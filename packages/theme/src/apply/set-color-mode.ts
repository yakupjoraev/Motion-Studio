import { clearColorMode, storeColorMode } from '../script/color-mode-script'

import { environmentMode } from './apply-theme'

import type { ColorMode } from '@motion-studio/tokens'
import type { ColorModePreference } from '../theme.types'

export interface SetColorModeOptions {
  /** Defaults to `document.documentElement`, which is where the generated stylesheet selects. */
  readonly root?: HTMLElement
}

/**
 * `THEME_ENGINE.md` § Colour mode. The one way to switch the mode, and the sequence is the whole reason
 * this exists: an explicit choice is an attribute **and** a stored preference, and `system` is the absence
 * of both — with no attribute the stylesheet's `prefers-color-scheme` block decides, which is what makes a
 * first paint correct with no JavaScript (ADR-026).
 *
 * It returns the mode now in effect so a caller drawing the state does not resolve `system` a second time.
 */
export function setColorMode(
  preference: ColorModePreference,
  options: SetColorModeOptions = {},
): ColorMode {
  const root = options.root ?? document.documentElement

  if (preference === 'system') {
    root.removeAttribute('data-color-mode')
    clearColorMode()

    return environmentMode()
  }

  root.dataset['colorMode'] = preference
  storeColorMode(preference)

  return preference
}
