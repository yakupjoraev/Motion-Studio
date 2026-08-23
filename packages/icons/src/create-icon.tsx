import type { ReactElement } from 'react'

import { ICON_GEOMETRY, ICON_SVG_ATTRIBUTES, type IconShape } from './geometry'
import type { IconName } from './icon-name'
import type { IconComponent, IconProps } from './icon.types'

/** A filled shape carries its own paint, because the `<svg>` above it is stroked and unfilled. */
const paintOf = (shape: IconShape): { fill?: string; stroke?: string } =>
  shape.filled === undefined ? {} : { fill: 'currentColor', stroke: 'none' }

const shapeElement = (shape: IconShape, index: number): ReactElement =>
  shape.tag === 'path' ? (
    <path d={shape.d} key={index} strokeDasharray={shape.strokeDasharray} {...paintOf(shape)} />
  ) : (
    <circle cx={shape.cx} cy={shape.cy} key={index} r={shape.r} {...paintOf(shape)} />
  )

const componentName = (name: IconName): string =>
  `${name
    .split('-')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join('')}Icon`

/**
 * The one place the icon contract lives — `DESIGN_SYSTEM.md` § Iconography: a 20 × 20 grid, 1.5 px stroke,
 * `currentColor`, round caps and joins, no fill. Both halves of it come from `geometry.ts`, which the
 * export path reads as well (ADR-250), so neither the glyph nor the contract is written twice.
 *
 * The geometry and the stroke contract are applied **after** the caller's props, so an icon cannot be
 * turned into a 24 × 18 filled shape by accident. Everything else — `className`, `onClick`, `data-*`,
 * `style` — passes straight through.
 *
 * Accessibility follows the prompt's rule: an icon is decorative and its container carries the accessible
 * name, so `aria-hidden="true"` is the default. A caller that does need a labelled icon passes
 * `aria-label` (or `aria-labelledby`), and that removes `aria-hidden` and adds `role="img"` here rather
 * than at 89 call sites.
 */
export function createIcon(name: IconName): IconComponent {
  const shapes = ICON_GEOMETRY[name]

  function Icon({ size = 16, strokeWidth = 1.5, ...rest }: IconProps): ReactElement {
    const labelled = rest['aria-label'] !== undefined || rest['aria-labelledby'] !== undefined

    return (
      <svg
        {...rest}
        width={size}
        height={size}
        {...ICON_SVG_ATTRIBUTES}
        strokeWidth={strokeWidth}
        role={labelled ? 'img' : undefined}
        aria-hidden={labelled ? undefined : true}
        focusable="false"
      >
        {shapes.map(shapeElement)}
      </svg>
    )
  }

  Icon.displayName = componentName(name)

  return Icon
}
