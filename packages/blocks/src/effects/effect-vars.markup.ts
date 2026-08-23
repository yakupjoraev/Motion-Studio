import type { CSSProperties } from 'react'

/**
 * The tuning an effect carries as inline style, in the form `MarkupElement.cssVars` takes.
 *
 * `effectVars` and the per-effect style helpers answer in `CSSProperties` because that is what the
 * components spend them on. The IR holds the same declarations as strings, so this is the one place
 * the two shapes meet — and it stays a type-only import of React, which is erased.
 */
export const cssVarsOf = (style: CSSProperties): Readonly<Record<string, string>> =>
  Object.fromEntries(Object.entries(style).map(([property, value]) => [property, String(value)]))
