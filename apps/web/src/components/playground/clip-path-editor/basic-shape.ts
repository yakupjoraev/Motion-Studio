import { type ShapeUnit, formatLength } from './parse-polygon'

/**
 * The shapes that are not polygons. They have no vertices to drag, so they get numbered parameters
 * instead — one slider each, over one model, because a circle and an inset differ only in how many
 * numbers they carry and what those numbers are called.
 */
export type ShapeKind = 'polygon' | 'circle' | 'ellipse' | 'inset' | 'path' | 'other'

export interface ShapeParameter {
  readonly id: string
  readonly label: string
  readonly value: number
  readonly unit: ShapeUnit
  readonly max: number
}

export interface ParametricShape {
  readonly kind: 'circle' | 'ellipse' | 'inset'
  readonly parameters: readonly ShapeParameter[]
}

export function shapeKindOf(value: string): ShapeKind {
  const name = /^([a-z-]+)\s*\(/i.exec(value.trim())?.[1]?.toLowerCase()

  switch (name) {
    case 'polygon':
    case 'circle':
    case 'ellipse':
    case 'inset':
    case 'path':
      return name
    default:
      return 'other'
  }
}

const LENGTH = /^(-?\d*\.?\d+)(%|px)?$/

interface Length {
  readonly value: number
  readonly unit: ShapeUnit
}

const length = (token: string | undefined): Length | undefined => {
  const match = token === undefined ? null : LENGTH.exec(token)

  if (match === null || match === undefined) {
    return undefined
  }

  const value = Number(match[1])

  return Number.isFinite(value)
    ? { value, unit: (match[2] as ShapeUnit | undefined) ?? '%' }
    : undefined
}

const parameter = (
  id: string,
  label: string,
  from: Length | undefined,
  max: number,
): ShapeParameter | undefined =>
  from === undefined ? undefined : { id, label, value: from.value, unit: from.unit, max }

const bodyOf = (value: string): string =>
  value
    .trim()
    .slice(value.indexOf('(') + 1, -1)
    .trim()

const tokensOf = (body: string): readonly string[] => body.split(/\s+/).filter((one) => one !== '')

/** `at cx cy` is optional in CSS; the editor always shows a centre, so an absent one is the middle. */
const centreOf = (tokens: readonly string[]): readonly [Length, Length] => {
  const at = tokens.indexOf('at')
  const middle: Length = { value: 50, unit: '%' }

  if (at === -1) {
    return [middle, middle]
  }

  return [length(tokens[at + 1]) ?? middle, length(tokens[at + 2]) ?? middle]
}

const defined = (parameters: readonly (ShapeParameter | undefined)[]): readonly ShapeParameter[] =>
  parameters.filter((one) => one !== undefined)

function parseCircle(tokens: readonly string[]): ParametricShape | undefined {
  const [cx, cy] = centreOf(tokens)
  const parameters = defined([
    parameter('r', 'Radius', length(tokens[0]), 100),
    parameter('cx', 'Centre x', cx, 100),
    parameter('cy', 'Centre y', cy, 100),
  ])

  return parameters.length === 3 ? { kind: 'circle', parameters } : undefined
}

function parseEllipse(tokens: readonly string[]): ParametricShape | undefined {
  const [cx, cy] = centreOf(tokens)
  const parameters = defined([
    parameter('rx', 'Radius x', length(tokens[0]), 100),
    parameter('ry', 'Radius y', length(tokens[1]), 100),
    parameter('cx', 'Centre x', cx, 100),
    parameter('cy', 'Centre y', cy, 100),
  ])

  return parameters.length === 4 ? { kind: 'ellipse', parameters } : undefined
}

const EDGES = ['Top', 'Right', 'Bottom', 'Left'] as const

/** The 1–4 value shorthand every box property uses, spelled out so each edge gets its own slider. */
const expandEdges = (lengths: readonly Length[]): readonly Length[] | undefined => {
  const [first, second, third, fourth] = lengths

  if (first === undefined) {
    return undefined
  }

  if (second === undefined) {
    return [first, first, first, first]
  }

  if (third === undefined) {
    return [first, second, first, second]
  }

  return [first, second, third, fourth ?? second]
}

function parseInset(tokens: readonly string[]): ParametricShape | undefined {
  const round = tokens.indexOf('round')
  const edges = expandEdges(
    (round === -1 ? tokens : tokens.slice(0, round))
      .map((token) => length(token))
      .filter((one): one is Length => one !== undefined),
  )

  if (edges === undefined) {
    return undefined
  }

  const radius = round === -1 ? undefined : length(tokens[round + 1])
  const parameters = defined([
    ...EDGES.map((edge, index) => parameter(edge, edge, edges[index], 100)),
    ...(radius === undefined ? [] : [parameter('round', 'Corner', radius, 200)]),
  ])

  return { kind: 'inset', parameters }
}

export function parseParametricShape(value: string): ParametricShape | undefined {
  const tokens = tokensOf(bodyOf(value))

  switch (shapeKindOf(value)) {
    case 'circle':
      return parseCircle(tokens)
    case 'ellipse':
      return parseEllipse(tokens)
    case 'inset':
      return parseInset(tokens)
    default:
      return undefined
  }
}

const printed = (one: ShapeParameter): string => `${formatLength(one.value)}${one.unit}`

const find = (shape: ParametricShape, id: string): ShapeParameter | undefined =>
  shape.parameters.find((one) => one.id === id)

export function serializeParametricShape(shape: ParametricShape): string {
  const at = (): string => {
    const cx = find(shape, 'cx')
    const cy = find(shape, 'cy')

    return cx === undefined || cy === undefined ? '' : ` at ${printed(cx)} ${printed(cy)}`
  }

  if (shape.kind === 'circle') {
    const r = find(shape, 'r')

    return `circle(${r === undefined ? '' : printed(r)}${at()})`
  }

  if (shape.kind === 'ellipse') {
    const rx = find(shape, 'rx')
    const ry = find(shape, 'ry')
    const radii = [rx, ry]
      .filter((one) => one !== undefined)
      .map(printed)
      .join(' ')

    return `ellipse(${radii}${at()})`
  }

  const edges = EDGES.map((edge) => find(shape, edge))
    .filter((one) => one !== undefined)
    .map(printed)
    .join(' ')
  const corner = find(shape, 'round')

  return `inset(${edges}${corner === undefined ? '' : ` round ${printed(corner)}`})`
}

export function withParameter(shape: ParametricShape, id: string, value: number): ParametricShape {
  return {
    ...shape,
    parameters: shape.parameters.map((one) => (one.id === id ? { ...one, value } : one)),
  }
}
