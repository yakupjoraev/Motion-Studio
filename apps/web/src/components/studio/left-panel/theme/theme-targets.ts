'use client'

/**
 * Where the document's theme is written — ADR-404.
 *
 * Not `document.documentElement`. The chrome is the studio's own surface and belongs to the colour
 * mode the user picked; the document's theme belongs to the page they are composing. Writing the
 * document's theme to the root made the two the same thing, so choosing light and opening a dark
 * document left the whole editor dark and the preference silently discarded.
 *
 * **Plural, because `MultiFrameView` renders one artboard per breakpoint.** A single element would
 * theme the first frame and leave the rest on the chrome's variables.
 */
export const THEME_SCOPE_ATTRIBUTE = 'data-ms-theme-scope'

const SELECTOR = '[data-testid="canvas-artboard"]'

export const themeTargets = (): readonly HTMLElement[] =>
  [...document.querySelectorAll<HTMLElement>(SELECTOR)].map((element) => {
    element.setAttribute(THEME_SCOPE_ATTRIBUTE, '')

    return element
  })

/**
 * Artboards arrive after the host mounts and come and go with the breakpoint and the multi-frame
 * toggle, so the targets are watched rather than read once. The callback fires on the frame a new
 * artboard appears, which is what stops a freshly switched breakpoint painting in the chrome's
 * colours for a beat.
 */
export function watchThemeTargets(onChange: (targets: readonly HTMLElement[]) => void): () => void {
  let known = 0

  const check = (): void => {
    const targets = themeTargets()

    // Length is enough: an artboard that is replaced is a different element in the same count, and
    // the observer fires for that too — this only skips the mutations that touched nothing.
    if (targets.length !== known || targets.length === 0) {
      known = targets.length
    }

    onChange(targets)
  }

  const observer = new MutationObserver(check)

  observer.observe(document.body, { childList: true, subtree: true })
  check()

  return () => observer.disconnect()
}
