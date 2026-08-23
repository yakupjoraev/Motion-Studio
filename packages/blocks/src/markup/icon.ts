import { ICON_GEOMETRY, ICON_SVG_ATTRIBUTES, type IconShape } from '@motion-studio/icons/geometry'
import { type MarkupElement, type MarkupValue, el, literal } from '@motion-studio/schema'

/**
 * An icon in an exported page — ADR-250. It is a real `<svg>` with the geometry inside it, never an
 * import: the project a user unzips has no icon package, and `PRODUCT.md` § 7 promises the export
 * compiles in a fresh scaffold.
 *
 * The glyph and the stroke contract come from `@motion-studio/icons/geometry`, which is data with no
 * React in it — the same table the components are built from, so a canvas glyph and an exported glyph
 * cannot drift.
 */
export interface IconMarkupInput {
  readonly name: string
  readonly size: number
  readonly className?: string | undefined
  /** An accessible name, when the glyph is not decorative. Absent, the icon is hidden — the component's rule. */
  readonly label?: string | undefined
}

const CONTRACT: Readonly<Record<string, MarkupValue>> = Object.fromEntries(
  Object.entries(ICON_SVG_ATTRIBUTES).map(([attribute, value]) => [attribute, literal(value)]),
)

const paintOf = (shape: IconShape): Readonly<Record<string, MarkupValue>> =>
  shape.filled === undefined ? {} : { fill: literal('currentColor'), stroke: literal('none') }

const shapeElement = (shape: IconShape): MarkupElement =>
  shape.tag === 'path'
    ? el('path', {
        attributes: {
          d: literal(shape.d),
          ...(shape.strokeDasharray === undefined
            ? {}
            : { strokeDasharray: literal(shape.strokeDasharray) }),
          ...paintOf(shape),
        },
      })
    : el('circle', {
        attributes: {
          cx: literal(shape.cx),
          cy: literal(shape.cy),
          r: literal(shape.r),
          ...paintOf(shape),
        },
      })

/** A name the table does not know draws nothing, which is what the components do with one. */
export function iconMarkup({
  name,
  size,
  className,
  label,
}: IconMarkupInput): MarkupElement | null {
  const shapes: readonly IconShape[] | undefined = ICON_GEOMETRY[name as keyof typeof ICON_GEOMETRY]

  if (shapes === undefined) {
    return null
  }

  return el('svg', {
    ...(className === undefined ? {} : { classNames: [className] }),
    attributes: {
      ...(label === undefined
        ? { 'aria-hidden': literal(true) }
        : { role: literal('img'), 'aria-label': literal(label) }),
      width: literal(size),
      height: literal(size),
      ...CONTRACT,
      focusable: literal('false'),
    },
    children: shapes.map(shapeElement),
  })
}
