import type { IRRule, IRStylesheet } from '../ir/ir.types'

/**
 * The stylesheet passes 3 and 4 produced: the rules a `custom` class rule needed because the value has
 * no Tailwind equivalent, the `prefers-reduced-motion` block that switches a CSS-engine preset off, and
 * the `@keyframes` the presets wrote.
 *
 * It lives beside the printers rather than inside one because two targets write it into different
 * files — `styles.css` for the React export, `app/globals.css` for the Next one — and a second copy of
 * this loop would be a second place for the media grouping to be wrong.
 */
const declarations = (rule: IRRule, indent: string): string =>
  rule.declarations.map((declaration) => `${indent}  ${declaration};`).join('\n')

const block = (rule: IRRule, indent = ''): string =>
  `${indent}${rule.selector} {\n${declarations(rule, indent)}\n${indent}}`

export function printStylesheet(stylesheet: IRStylesheet): string {
  const plain = stylesheet.rules.filter((rule) => rule.media === undefined)
  const queries = new Map<string, IRRule[]>()

  for (const rule of stylesheet.rules) {
    if (rule.media === undefined) {
      continue
    }

    queries.set(rule.media, [...(queries.get(rule.media) ?? []), rule])
  }

  const media = [...queries].map(
    ([query, rules]) =>
      `@media ${query} {\n${rules.map((rule) => block(rule, '  ')).join('\n\n')}\n}`,
  )

  return [
    ...plain.map((rule) => block(rule)),
    ...media,
    ...stylesheet.keyframes.map((frame) => frame.trimEnd()),
  ].join('\n\n')
}

export const isEmpty = (stylesheet: IRStylesheet): boolean =>
  stylesheet.rules.length === 0 && stylesheet.keyframes.length === 0
