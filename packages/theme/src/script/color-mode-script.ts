/**
 * The one blocking inline script in the app. `THEME_ENGINE.md` § Colour mode: it sets `data-color-mode`
 * before first paint, and the alternative is a flash of the wrong theme on every reload.
 *
 * It handles the **stored** preference only, and references nothing outside `document` and
 * `localStorage`. The system preference needs no script at all: the generated stylesheet carries the dark
 * block a second time under `@media (prefers-color-scheme: dark)` for a root with no attribute yet, so a
 * first-time visitor whose OS is dark paints dark with no JavaScript involved — ADR-026.
 *
 * `try` is not optional: `localStorage` throws on access in a blocked-cookie context, and an exception in
 * a blocking head script would leave the document with no attribute and no styling decision.
 */
export const COLOR_MODE_STORAGE_KEY = 'ms-color-mode'

export const COLOR_MODE_SCRIPT = `try{var m=localStorage.getItem('${COLOR_MODE_STORAGE_KEY}');if(m==='light'||m==='dark'){document.documentElement.dataset.colorMode=m}}catch(e){}`

/** Reads the stored preference, or `undefined` when the user has not chosen one. */
export function storedColorMode(): 'light' | 'dark' | undefined {
  try {
    const value = localStorage.getItem(COLOR_MODE_STORAGE_KEY)

    return value === 'light' || value === 'dark' ? value : undefined
  } catch {
    return undefined
  }
}

export function storeColorMode(mode: 'light' | 'dark'): void {
  try {
    localStorage.setItem(COLOR_MODE_STORAGE_KEY, mode)
  } catch {
    // A blocked storage context is not an error worth surfacing: the preference simply does not persist.
  }
}

/**
 * Forgets the stored preference, which is what `system` means: with no key the script above sets no
 * attribute, and the generated stylesheet's `prefers-color-scheme` block decides — ADR-026. Writing
 * `'system'` into storage instead would leave the script with a value it does not recognise.
 */
export function clearColorMode(): void {
  try {
    localStorage.removeItem(COLOR_MODE_STORAGE_KEY)
  } catch {
    // Same as above: nothing to persist, nothing to report.
  }
}
