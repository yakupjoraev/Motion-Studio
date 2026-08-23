/**
 * The normaliser the markup parity test compares through — ADR-249, extended by ADR-251.
 *
 * It removes exactly three kinds of difference, and each one is a difference the export is *entitled*
 * to:
 *
 * - `data-testid`, which is a canvas affordance and not markup a user's page should carry
 * - the spelling of ids, which React and Radix generate and a producer cannot reproduce — every id and
 *   every reference to one is renumbered in document order, so `aria-describedby` still has to point
 *   at the right element while the value itself is free. An id that is *content* rather than linkage —
 *   a heading's anchor — is asserted literally by `registry.markup.test.tsx` instead
 * - the bookkeeping a UI library writes for its own runtime, which the exported page does not ship:
 *   `data-radix-*`, the `aria-hidden` Radix's aria-hider pairs with `data-aria-hidden`, and the six
 *   inline declarations Radix writes to drive its own animation and focus handling
 * - whitespace between tags, which JSX inserts and a producer does not
 *
 * Anything else that differs is a real difference, and the test says so. There is no per-block
 * exception list, because a block that cannot match is a producer that is wrong or a component doing
 * something the export cannot carry — a fix or an ADR, not a skip.
 */

/** Where an id is written or pointed at. What it links to is checked; the spelling is not. */
const ID_ATTRIBUTES = ['id', 'for', 'aria-describedby', 'aria-labelledby', 'aria-controls']

/** Written by Radix for its own runtime. An exported page has no Radix in it. */
const LIBRARY_ATTRIBUTE = /^data-radix-/

/**
 * Radix's own inline declarations: the collapsible's measured size, the roving-focus outline
 * suppression, the dialog's pointer gate, and the two properties it zeroes on the first frame so a
 * panel that starts open does not animate open. A block states its own styles through classes and
 * `--ms-*` variables (COMPONENT_LIBRARY.md § Rules 3), so none of these is a block's to lose.
 */
const LIBRARY_DECLARATION =
  /^(--radix-|outline$|pointer-events$|animation-duration$|animation-name$|transition-duration$)/

/**
 * Every id, in document order. Radix names a trigger `radix-_r_8_-trigger-radix-_r_a_` and an exported
 * page names it something a person can read; what has to survive is that the same pairs of elements
 * are linked, which is what renumbering asserts.
 */
const collectIds = (root: Element): Map<string, string> => {
  const stable = new Map<string, string>()

  for (const element of [root, ...root.querySelectorAll('*')]) {
    for (const name of ID_ATTRIBUTES) {
      for (const value of (element.getAttribute(name) ?? '').split(/\s+/)) {
        if (value !== '' && !stable.has(value)) {
          stable.set(value, `id${stable.size + 1}`)
        }
      }
    }
  }

  return stable
}

const stripLibraryStyle = (element: Element): void => {
  const style = element.getAttribute('style')

  if (style === null) {
    return
  }

  const kept = style
    .split(';')
    .map((declaration) => declaration.trim())
    .filter((declaration) => declaration !== '')
    .filter((declaration) => !LIBRARY_DECLARATION.test(declaration.split(':')[0]?.trim() ?? ''))

  if (kept.length === 0) {
    element.removeAttribute('style')

    return
  }

  element.setAttribute('style', `${kept.join('; ')};`)
}

function stripLibraryAttributes(element: Element): void {
  for (const name of [...element.attributes].map((attribute) => attribute.name)) {
    if (LIBRARY_ATTRIBUTE.test(name)) {
      element.removeAttribute(name)
    }
  }

  // Radix hides the rest of the document while a dialog is open, and marks what it hid.
  if (element.getAttribute('data-aria-hidden') !== null) {
    element.removeAttribute('data-aria-hidden')
    element.removeAttribute('aria-hidden')
  }

  stripLibraryStyle(element)
}

export function normaliseMarkup(root: Element): string {
  const clone = root.cloneNode(true) as Element
  const stable = collectIds(clone)

  for (const element of [clone, ...clone.querySelectorAll('*')]) {
    element.removeAttribute('data-testid')
    stripLibraryAttributes(element)

    for (const name of ID_ATTRIBUTES) {
      const value = element.getAttribute(name)

      if (value === null) {
        continue
      }

      const mapped = value
        .split(/\s+/)
        .map((entry) => stable.get(entry) ?? entry)
        .join(' ')

      element.setAttribute(name, mapped)
    }

    // Attribute order is not markup. Sorting makes the comparison about content.
    const attributes = [...element.attributes]
      .map((attribute) => [attribute.name, attribute.value] as const)
      .sort(([a], [b]) => a.localeCompare(b))

    for (const [name] of attributes) {
      element.removeAttribute(name)
    }

    for (const [name, value] of attributes) {
      element.setAttribute(name, value)
    }
  }

  return clone.outerHTML.replace(/>\s+</g, '><').trim()
}
