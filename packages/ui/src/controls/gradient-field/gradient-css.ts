import type { ColorStop, Gradient, MeshPoint, Position } from '@motion-studio/tokens'

const stopList = (stops: readonly ColorStop[]): string =>
  stops.map((stop) => `${stop.color} ${stop.position}%`).join(', ')

const atPosition = (position: Position): string => `${position.x}% ${position.y}%`

/** § Gradients: "Mesh gradients render as stacked `radial-gradient`s plus a blur." */
const meshLayer = (point: MeshPoint): string =>
  `radial-gradient(circle ${point.radius}% at ${atPosition(point)}, ${point.color} 0%, transparent 100%)`

/**
 * A `background-image` value. The mesh kind's blur is a filter on the element rather than part of this
 * string, which is why `fromCss` does not read mesh back — ADR-044.
 */
export function toCss(gradient: Gradient): string {
  switch (gradient.kind) {
    case 'linear':
      return `linear-gradient(${gradient.angle}deg, ${stopList(gradient.stops)})`
    case 'radial':
      return `radial-gradient(${gradient.shape} at ${atPosition(gradient.at)}, ${stopList(gradient.stops)})`
    case 'conic':
      return `conic-gradient(from ${gradient.from}deg at ${atPosition(gradient.at)}, ${stopList(gradient.stops)})`
    default:
      return gradient.points.map(meshLayer).join(', ')
  }
}

/** Commas inside `oklch(…)` are not argument separators, so the split counts parentheses. */
function splitTop(input: string): string[] {
  const parts: string[] = []
  let depth = 0
  let current = ''

  for (const char of input) {
    if (char === '(') {
      depth += 1
    }

    if (char === ')') {
      depth -= 1
    }

    if (char === ',' && depth === 0) {
      parts.push(current)
      current = ''
    } else {
      current += char
    }
  }

  parts.push(current)

  return parts
}

/**
 * The position is the last whitespace-separated token, anchored at the end. A colour's own spaces are
 * inside its parentheses, so they never reach the anchor: `oklch(58% 0.18 285) 40%` splits correctly and
 * a stop with no position at all is rejected rather than guessed at.
 */
function parseStop(input: string): ColorStop | null {
  const match = /^(.*?)\s+(-?[\d.]+)%$/.exec(input.trim())
  const color = match?.[1]?.trim() ?? ''
  const position = Number.parseFloat(match?.[2] ?? '')

  if (color === '' || Number.isNaN(position)) {
    return null
  }

  return { color, position }
}

function parseStops(parts: readonly string[]): ColorStop[] | null {
  const stops = parts.map(parseStop)

  // Two is the fewest a gradient can be drawn from, and `toCss` never writes fewer.
  if (stops.length < 2 || stops.some((stop) => stop === null)) {
    return null
  }

  return stops.filter((stop): stop is ColorStop => stop !== null)
}

const FUNCTION = /^(linear|radial|conic)-gradient\((.*)\)$/s
const ANGLE = /^(-?[\d.]+)deg$/
const RADIAL_AT = /^(circle|ellipse)\s+at\s+(-?[\d.]+)%\s+(-?[\d.]+)%$/
const CONIC_AT = /^from\s+(-?[\d.]+)deg\s+at\s+(-?[\d.]+)%\s+(-?[\d.]+)%$/

const numberAt = (match: RegExpExecArray, index: number): number =>
  Number.parseFloat(match[index] ?? '')

/**
 * The grammar `toCss` emits, plus whitespace tolerance — ADR-040. `null` for anything else, including
 * every mesh gradient and every CSS form this module would not have written.
 */
export function fromCss(input: string): Gradient | null {
  const call = FUNCTION.exec(input.trim())

  if (call === null) {
    return null
  }

  const [head = '', ...rest] = splitTop(call[2] ?? '')
  const angle = ANGLE.exec(head.trim())
  const radial = RADIAL_AT.exec(head.trim())
  const conic = CONIC_AT.exec(head.trim())
  const kind = call[1]

  if (kind === 'linear') {
    const stops = parseStops(angle === null ? [head, ...rest] : rest)

    return stops === null ? null : { kind, angle: angle === null ? 180 : numberAt(angle, 1), stops }
  }

  if (kind === 'radial' && radial !== null) {
    const stops = parseStops(rest)
    const shape = radial[1] === 'circle' ? 'circle' : 'ellipse'

    return stops === null
      ? null
      : { kind, shape, at: { x: numberAt(radial, 2), y: numberAt(radial, 3) }, stops }
  }

  if (kind === 'conic' && conic !== null) {
    const stops = parseStops(rest)

    return stops === null
      ? null
      : {
          kind,
          from: numberAt(conic, 1),
          at: { x: numberAt(conic, 2), y: numberAt(conic, 3) },
          stops,
        }
  }

  return null
}
