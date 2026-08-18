import type { RuntimeModule } from '@motion-studio/schema'

/**
 * What the export writes beside the component — ADR-201.
 *
 * The user's project has no theme engine in it, so the twelve statements this block depends on travel as source
 * rather than as a dependency. Every one of them matches `packages/theme`: the same storage key, the same
 * `data-color-mode` attribute, and the same rule that `system` is the **absence** of both, so the generated
 * stylesheet's `prefers-color-scheme` block decides (ADR-026).
 *
 * `theme-toggle.codegen.test.ts` asserts the key against `COLOR_MODE_STORAGE_KEY` imported from the theme
 * package, so the two cannot drift apart in silence.
 *
 * No backtick appears in the source below on purpose: the inline script is a double-quoted string, which keeps
 * this file a plain template literal with nothing escaped inside it.
 */
const SOURCE = `export const COLOR_MODE_STORAGE_KEY = 'ms-color-mode'

export type ColorModePreference = 'light' | 'dark' | 'system'

/**
 * Put this in <head> before anything paints, so a reload does not flash the wrong theme:
 *   <script dangerouslySetInnerHTML={{ __html: COLOR_MODE_SCRIPT }} />
 *
 * try/catch is not optional: localStorage throws in a blocked-cookie context, and an exception in a blocking
 * head script would leave the document with no styling decision at all.
 */
export const COLOR_MODE_SCRIPT =
  "try{var m=localStorage.getItem('ms-color-mode');if(m==='light'||m==='dark'){document.documentElement.dataset.colorMode=m}}catch(e){}"

/** The stored choice, or undefined when the reader has not made one. */
export function storedColorMode(): 'light' | 'dark' | undefined {
  try {
    const value = localStorage.getItem(COLOR_MODE_STORAGE_KEY)

    return value === 'light' || value === 'dark' ? value : undefined
  } catch {
    return undefined
  }
}

/** What the operating system asks for right now. */
export function environmentMode(): 'light' | 'dark' {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light'
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Switches the mode and returns the one now in effect.
 *
 * 'system' removes the attribute and the stored key rather than writing 'system' into either: with no attribute
 * the stylesheet's own prefers-color-scheme block decides, which is what makes a first paint correct with no
 * JavaScript involved.
 */
export function setColorMode(preference: ColorModePreference): 'light' | 'dark' {
  const root = document.documentElement

  if (preference === 'system') {
    root.removeAttribute('data-color-mode')
    try {
      localStorage.removeItem(COLOR_MODE_STORAGE_KEY)
    } catch {
      // A blocked storage context is not an error worth surfacing.
    }

    return environmentMode()
  }

  root.dataset.colorMode = preference
  try {
    localStorage.setItem(COLOR_MODE_STORAGE_KEY, preference)
  } catch {
    // Same as above: the preference simply does not persist.
  }

  return preference
}
`

export const COLOR_MODE_MODULE: RuntimeModule = {
  path: 'lib/color-mode.ts',
  named: ['COLOR_MODE_SCRIPT', 'COLOR_MODE_STORAGE_KEY', 'setColorMode', 'storedColorMode'],
  source: SOURCE,
}
