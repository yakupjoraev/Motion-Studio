import type { AlignValue } from '../align-field/index'
import type { ColorValue } from '../color-picker/index'
import type { FontValue } from '../font-field/index'
import type { ImageValue } from '../image-field/index'
import type { LinkValue } from '../link-field/index'
import type { RadiusValue } from '../radius-field/index'
import type { ShadowLayer } from '../shadow-field/index'
import type { SpacingValue } from '../spacing-field/index'

/**
 * Nothing here imports a control. This module is in the panel's first chunk — the switch reads a
 * value before it knows which control will take it — so an import of the gradient editor or the icon
 * registry from here would undo every `lazy` in `control-renderer.tsx`.
 *
 * A node's props are parsed against the block's schema before they ever reach here, so a value of
 * the wrong shape means the block's `controls` metadata disagrees with its own schema — the case the
 * registry meta-test exists to catch. These coercions are what the panel does in the meantime:
 * render the control empty rather than hand `undefined` to something that will divide by it.
 */
export const asString = (value: unknown): string => (typeof value === 'string' ? value : '')

export const asNumber = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0

/**
 * What a choice control shows as selected. A descriptor may declare its options as numbers (ADR-351),
 * and `asString` would answer `''` for one — which is Radix's "nothing selected" and would leave a set
 * property looking unset.
 */
export const asOptionValue = (value: unknown): string =>
  typeof value === 'number' && Number.isFinite(value) ? String(value) : asString(value)

export const asBoolean = (value: unknown): boolean => value === true

const record = (value: unknown): Readonly<Record<string, unknown>> =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}

const side = (value: unknown, key: string): number => asNumber(record(value)[key])

export const asSpacing = (value: unknown): SpacingValue => ({
  top: side(value, 'top'),
  right: side(value, 'right'),
  bottom: side(value, 'bottom'),
  left: side(value, 'left'),
})

export const asRadius = (value: unknown): RadiusValue => ({
  topLeft: side(value, 'topLeft'),
  topRight: side(value, 'topRight'),
  bottomRight: side(value, 'bottomRight'),
  bottomLeft: side(value, 'bottomLeft'),
})

const axis = (value: unknown, key: string): AlignValue['horizontal'] => {
  const found = record(value)[key]

  return found === 'center' || found === 'end' ? found : 'start'
}

export const asAlign = (value: unknown): AlignValue => ({
  horizontal: axis(value, 'horizontal'),
  vertical: axis(value, 'vertical'),
})

/** A bare string is a token name — the form a block stores a theme colour in. */
export const asColor = (value: unknown): ColorValue => {
  const held = record(value)

  if (held['kind'] === 'token' && typeof held['token'] === 'string') {
    return { kind: 'token', token: held['token'] }
  }

  if (held['kind'] === 'color' && typeof held['color'] === 'string') {
    return { kind: 'color', color: held['color'] }
  }

  return typeof value === 'string' && value.startsWith('#')
    ? { kind: 'color', color: value }
    : { kind: 'token', token: asString(value) }
}

export const asFont = (value: unknown): FontValue => {
  const held = record(value)

  return {
    family: asString(held['family']),
    size: asNumber(held['size']),
    weight: asNumber(held['weight']),
    tracking: asNumber(held['tracking']),
  }
}

export const asImage = (value: unknown): ImageValue => {
  const held = record(value)

  return { src: asString(held['src']), alt: asString(held['alt']) }
}

export const asLink = (value: unknown): LinkValue => {
  // ADR-354: a bare string is an href — the shape nine blocks' schemas actually store.
  if (typeof value === 'string') {
    return { href: value, target: '_self', rel: [] }
  }

  const held = record(value)
  const target = held['target']
  const rel = held['rel']

  return {
    href: asString(held['href']),
    target: target === '_blank' ? '_blank' : '_self',
    rel: Array.isArray(rel) ? rel.filter((one): one is string => typeof one === 'string') : [],
  }
}

export const asShadow = (value: unknown): readonly ShadowLayer[] =>
  Array.isArray(value)
    ? value.map((layer) => {
        const held = record(layer)

        return {
          x: asNumber(held['x']),
          y: asNumber(held['y']),
          blur: asNumber(held['blur']),
          spread: asNumber(held['spread']),
          color: asString(held['color']),
          inset: asBoolean(held['inset']),
        }
      })
    : []

export const asList = (value: unknown): readonly Readonly<Record<string, unknown>>[] =>
  Array.isArray(value) ? value.map(record) : []
