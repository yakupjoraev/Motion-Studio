import type { ShadowLayer } from './shadow-field.types'

const layerToCss = (layer: ShadowLayer): string => {
  const lengths = `${layer.x}px ${layer.y}px ${layer.blur}px ${layer.spread}px`

  return `${layer.inset ? 'inset ' : ''}${lengths} ${layer.color}`
}

/** `none` for an empty stack, which is what CSS calls no shadow. */
export function toCss(layers: readonly ShadowLayer[]): string {
  return layers.length === 0 ? 'none' : layers.map(layerToCss).join(', ')
}

/** Commas inside `oklch(…)` and `color-mix(…)` are not layer separators. */
function splitLayers(input: string): string[] {
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

/** Splits on whitespace that is not inside a function call, so a colour stays one token. */
function tokenise(input: string): string[] {
  const tokens: string[] = []
  let depth = 0
  let current = ''

  for (const char of input.trim()) {
    if (char === '(') {
      depth += 1
    }

    if (char === ')') {
      depth -= 1
    }

    if (/\s/.test(char) && depth === 0) {
      if (current !== '') {
        tokens.push(current)
        current = ''
      }
    } else {
      current += char
    }
  }

  if (current !== '') {
    tokens.push(current)
  }

  return tokens
}

const PX = /^(-?[\d.]+)px$/

function parseLayer(input: string): ShadowLayer | null {
  const tokens = tokenise(input)
  const inset = tokens[0] === 'inset'
  const rest = inset ? tokens.slice(1) : tokens

  // Four lengths and a colour is what `toCss` writes; the two- and three-length CSS forms are not it.
  if (rest.length !== 5) {
    return null
  }

  const lengths = rest.slice(0, 4).map((token) => Number.parseFloat(PX.exec(token)?.[1] ?? ''))
  const [x = Number.NaN, y = Number.NaN, blur = Number.NaN, spread = Number.NaN] = lengths
  const color = rest[4] ?? ''

  if (lengths.some(Number.isNaN) || color === '') {
    return null
  }

  return { x, y, blur, spread, color, inset }
}

/**
 * The grammar `toCss` emits, plus whitespace tolerance — ADR-040. `none` is the empty stack; anything
 * that is not four lengths and a colour per layer is reported rather than guessed at.
 */
export function fromCss(input: string): readonly ShadowLayer[] | null {
  const trimmed = input.trim()

  if (trimmed === 'none') {
    return []
  }

  if (trimmed === '') {
    return null
  }

  const layers = splitLayers(trimmed).map(parseLayer)

  if (layers.some((layer) => layer === null)) {
    return null
  }

  return layers.filter((layer): layer is ShadowLayer => layer !== null)
}
