import type { CssError } from '@motion-studio/schema/css'
import { type Result, err, ok } from '@motion-studio/utils'

/**
 * `polygon()` ↔ vertices, the model the handles drag — PLAYGROUND.md § Property sandboxes.
 *
 * One unit for the whole shape (ADR-276). CSS allows `polygon(0px 0%, …)`, and a handle that moved a
 * coordinate would then have to decide which unit it wrote; a mixed shape stays text and says so.
 */
export type ShapeUnit = '%' | 'px'

export interface Vertex {
  readonly x: number
  readonly y: number
}

export type FillRule = 'nonzero' | 'evenodd'

export interface Polygon {
  readonly vertices: readonly Vertex[]
  readonly unit: ShapeUnit
  readonly fillRule: FillRule | undefined
}

/** A polygon with two vertices is a line, and a line clips everything away. */
export const MIN_VERTICES = 3

const error = (message: string, column: number): CssError => ({
  message,
  line: 1,
  column: column + 1,
  severity: 'error',
  layer: 'structural',
})

const COORDINATE = /^(-?\d*\.?\d+)(%|px)?$/

interface Coordinate {
  readonly value: number
  readonly unit: ShapeUnit | undefined
}

const parseCoordinate = (token: string): Coordinate | undefined => {
  const match = COORDINATE.exec(token)

  if (match === null) {
    return undefined
  }

  const value = Number(match[1])

  // A bare `0` is legal in CSS and carries no unit, so it takes the shape's.
  return Number.isFinite(value) ? { value, unit: match[2] as ShapeUnit | undefined } : undefined
}

export function parsePolygon(input: string): Result<Polygon, CssError> {
  const value = input.trim()
  const open = value.indexOf('(')

  if (!value.toLowerCase().startsWith('polygon(') || !value.endsWith(')')) {
    return err(error('Only polygon() has draggable vertices.', 0))
  }

  const body = value.slice(open + 1, -1)
  const parts = body.split(',').map((part) => part.trim())
  const first = parts[0]?.toLowerCase()
  const fillRule = first === 'nonzero' || first === 'evenodd' ? (first as FillRule) : undefined
  const points = fillRule === undefined ? parts : parts.slice(1)
  const vertices: Vertex[] = []
  let unit: ShapeUnit | undefined

  for (const point of points) {
    const tokens = point.split(/\s+/).filter((token) => token !== '')

    if (tokens.length !== 2) {
      return err(error(`“${point}” is not an x y pair.`, body.indexOf(point) + open + 1))
    }

    const parsed = tokens.map((token) => parseCoordinate(token))
    const [x, y] = parsed

    if (x === undefined || y === undefined) {
      return err(error('A vertex takes two lengths in % or px.', body.indexOf(point) + open + 1))
    }

    for (const coordinate of [x, y]) {
      if (coordinate.unit === undefined) {
        continue
      }

      if (unit !== undefined && coordinate.unit !== unit) {
        return err(error('Mixed units: the handles need one unit for the whole shape.', 0))
      }

      unit = coordinate.unit
    }

    vertices.push({ x: x.value, y: y.value })
  }

  if (vertices.length < MIN_VERTICES) {
    return err(error(`A polygon needs at least ${MIN_VERTICES} vertices.`, 0))
  }

  return ok({ vertices, unit: unit ?? '%', fillRule })
}

/** Two decimals is a tenth of a pixel on a 1000 px target, and trailing zeros are noise. */
export const formatLength = (value: number): string =>
  String(Math.round(value * 100) / 100).replace(/^-0$/, '0')

export function serializePolygon(
  vertices: readonly Vertex[],
  unit: ShapeUnit,
  fillRule?: FillRule | undefined,
): string {
  const points = vertices.map(
    (vertex) => `${formatLength(vertex.x)}${unit} ${formatLength(vertex.y)}${unit}`,
  )

  return `polygon(${fillRule === undefined ? '' : `${fillRule}, `}${points.join(', ')})`
}

export interface TargetSize {
  readonly width: number
  readonly height: number
}

/** `%` ↔ `px` against the size the shape is drawn at, which is the only place the two meet. */
export function convertUnit(
  vertices: readonly Vertex[],
  from: ShapeUnit,
  to: ShapeUnit,
  size: TargetSize,
): readonly Vertex[] {
  if (from === to || size.width === 0 || size.height === 0) {
    return vertices
  }

  return vertices.map((vertex) =>
    to === 'px'
      ? { x: (vertex.x / 100) * size.width, y: (vertex.y / 100) * size.height }
      : { x: (vertex.x / size.width) * 100, y: (vertex.y / size.height) * 100 },
  )
}

/** The new vertex lands on the midpoint of the edge that was clicked, so the shape does not jump. */
export function insertVertex(vertices: readonly Vertex[], edge: number): readonly Vertex[] {
  const from = vertices[edge]
  const to = vertices[(edge + 1) % vertices.length]

  if (from === undefined || to === undefined) {
    return vertices
  }

  const midpoint = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 }

  return [...vertices.slice(0, edge + 1), midpoint, ...vertices.slice(edge + 1)]
}

export function removeVertex(vertices: readonly Vertex[], index: number): readonly Vertex[] {
  return vertices.length <= MIN_VERTICES ? vertices : vertices.filter((_, at) => at !== index)
}
