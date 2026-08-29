/**
 * Copy as Tailwind — PLAYGROUND.md § Sharing. A class where Tailwind names the property, and an
 * honest arbitrary property where it does not, rather than a class that would set something else.
 *
 * `bg-[…]` is the trap: it resolves to `background-color` or `background-image` depending on the
 * value, so a `background` shorthand with three layers and a colour does not survive it.
 */
const UTILITY: Readonly<Record<string, string>> = {
  'box-shadow': 'shadow',
}

export interface TailwindClass {
  readonly className: string
  /** What the reader has to know for this to be the right answer. */
  readonly note: string | undefined
}

/** Tailwind reads a space as the end of the class, so an arbitrary value spells one `_`. */
export const toArbitrary = (value: string): string =>
  value.replace(/_/g, String.raw`\_`).replace(/\s+/g, ' ').trim().replace(/ /g, '_')

export function toTailwindClass(property: string, value: string): TailwindClass {
  const utility = UTILITY[property]
  const arbitrary = toArbitrary(value)

  if (utility !== undefined) {
    return { className: `${utility}-[${arbitrary}]`, note: undefined }
  }

  return {
    className: `[${property}:${arbitrary}]`,
    note: `Tailwind has no utility for ${property} values like this one. The class above is the arbitrary-property form; a name for it belongs in a theme entry.`,
  }
}

/** Copy as CSS variable: the declaration and the line that uses it, because one without the other is half an answer. */
export const toCssVariable = (property: string, value: string): string =>
  `--custom: ${value};\n${property}: var(--custom);`
