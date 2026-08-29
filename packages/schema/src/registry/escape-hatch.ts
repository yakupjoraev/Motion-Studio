import { splitDeclarations } from '../sanitize/css/structural'

import type { BlockCapabilities, UnknownProps } from './registry.types'

/**
 * The `css` escape hatch — PLAYGROUND.md § Send to selection. The default set is the eight sandboxes,
 * every one of them paint-only: a value a reader sends from the playground can change how a block
 * looks and cannot change how it lays out, which is the contract a block would otherwise have to
 * defend prop by prop (ADR-275).
 */
export const ESCAPE_HATCH_PROPERTIES = [
  'background',
  'box-shadow',
  'filter',
  'backdrop-filter',
  'mask-image',
  'clip-path',
  'transform',
  'transition',
] as const

export type EscapeHatchProperty = (typeof ESCAPE_HATCH_PROPERTIES)[number]

/** The prop the value lands on, one name everywhere, matched by `sanitizeDocument`'s `CSS_KEYS`. */
export const ESCAPE_HATCH_PROP = 'css'

export const escapeHatchProperties = (capabilities: BlockCapabilities): readonly string[] =>
  capabilities.escapeHatch ?? ESCAPE_HATCH_PROPERTIES

export const acceptsEscapeHatch = (capabilities: BlockCapabilities, property: string): boolean =>
  escapeHatchProperties(capabilities).includes(property)

/**
 * One property replaced, the rest kept. A send from the playground sets `box-shadow` and must not
 * take the `clip-path` that was already there with it.
 */
export function withDeclaration(css: string, property: string, value: string): string {
  const kept = splitDeclarations(css)
    .declarations.filter((declaration) => declaration.property !== property)
    .map((declaration) => `${declaration.property}: ${declaration.value}`)
  const next = value.trim() === '' ? kept : [...kept, `${property}: ${value}`]

  return next.join(';\n')
}

const camel = (property: string): string =>
  property.replace(/-([a-z])/g, (_match, letter: string) => letter.toUpperCase())

/**
 * The stored declarations as a style object in React spelling, which is what both the canvas and the
 * IR's `cssVars` take. A property the block does not accept is dropped here rather than at the write:
 * a document can arrive from anywhere, and the block's list is the authority at paint time too.
 */
export function escapeHatchStyle(
  props: UnknownProps,
  capabilities: BlockCapabilities,
): Readonly<Record<string, string>> {
  const stored = props[ESCAPE_HATCH_PROP]

  if (typeof stored !== 'string' || stored.trim() === '') {
    return {}
  }

  const allowed = escapeHatchProperties(capabilities)
  const style: Record<string, string> = {}

  for (const declaration of splitDeclarations(stored).declarations) {
    if (allowed.includes(declaration.property) && declaration.value.trim() !== '') {
      style[camel(declaration.property)] = declaration.value
    }
  }

  return style
}
