/**
 * The normaliser the markup parity test compares through — ADR-249.
 *
 * It removes exactly three things, and each one is a difference the export is *entitled* to:
 *
 * - `data-testid`, which is a canvas affordance and not markup a user's page should carry
 * - the values of generated ids (`useId`), which are non-deterministic — they are renumbered in
 *   document order, so `aria-describedby` still has to point at the right element
 * - whitespace between tags, which JSX inserts and a producer does not
 *
 * Anything else that differs is a real difference, and the test says so. There is no per-block
 * exception list, because a block that cannot match is a producer that is wrong or a component doing
 * something the export cannot carry — a fix or an ADR, not a skip.
 */
const ID_ATTRIBUTES = ['id', 'for', 'aria-describedby', 'aria-labelledby', 'aria-controls']

/** React's `useId` produces `«r0»`-style values; the canvas and the producer never agree on them. */
const GENERATED = /^[«:_r«][\w:«»«»-]*$/

const collectIds = (root: Element): Map<string, string> => {
  const stable = new Map<string, string>()

  for (const element of [root, ...root.querySelectorAll('*')]) {
    for (const name of ID_ATTRIBUTES) {
      for (const value of (element.getAttribute(name) ?? '').split(/\s+/)) {
        if (value !== '' && GENERATED.test(value) && !stable.has(value)) {
          stable.set(value, `id${stable.size + 1}`)
        }
      }
    }
  }

  return stable
}

export function normaliseMarkup(root: Element): string {
  const clone = root.cloneNode(true) as Element
  const stable = collectIds(clone)

  for (const element of [clone, ...clone.querySelectorAll('*')]) {
    element.removeAttribute('data-testid')

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
