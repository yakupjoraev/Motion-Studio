import type { CSSProperties } from 'react'

import { TRANSFORM_COMPONENTS } from '../model/compose'
import type { TargetProperties, TargetValue } from '../model/preset.types'

/** The components that take a length, so a bare number means pixels. */
const LENGTHS = new Set(['x', 'y', 'z', 'translateX', 'translateY', 'translateZ'])

/** The components that take an angle. */
const ANGLES = new Set(['rotate', 'rotateX', 'rotateY', 'rotateZ', 'skew', 'skewX', 'skewY'])

const COMPONENTS = new Set(TRANSFORM_COMPONENTS)

const FUNCTIONS: Readonly<Record<string, string>> = {
  x: 'translateX',
  y: 'translateY',
  z: 'translateZ',
}

/**
 * A target as inline style, for the engine that has no engine: the css adapter and every static end
 * state. The transform components are folded into one `transform`, in the order they were written,
 * because a second `transform` declaration would replace the first rather than add to it.
 */
export function toStyle(target: TargetProperties): CSSProperties {
  const style: Record<string, string | number> = {}
  const transforms: string[] = []

  for (const [property, value] of Object.entries(target)) {
    const single = first(value)

    if (COMPONENTS.has(property)) {
      transforms.push(`${FUNCTIONS[property] ?? property}(${unit(property, single)})`)

      continue
    }

    style[property] = single
  }

  if (transforms.length > 0) {
    style['transform'] = transforms.join(' ')
  }

  return style as CSSProperties
}

/** A keyframe list has no single value; the css path takes the last one, which is where it lands. */
const first = (value: TargetValue): number | string =>
  Array.isArray(value) ? (value.at(-1) ?? 0) : (value as number | string)

const unit = (property: string, value: number | string): string => {
  if (typeof value === 'string') {
    return value
  }

  if (LENGTHS.has(property)) {
    return `${value}px`
  }

  return ANGLES.has(property) ? `${value}deg` : String(value)
}

/** The CSS `transition` a resolved transition means, in milliseconds and with its curve. */
export function toTransition(
  properties: readonly string[],
  duration: number,
  delay: number,
  ease: string,
): string {
  const list = properties.length === 0 ? ['all'] : properties

  return list.map((property) => `${property} ${duration}ms ${ease} ${delay}ms`).join(', ')
}
