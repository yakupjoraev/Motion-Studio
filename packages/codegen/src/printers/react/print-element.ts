import type { StructuredDataType } from '@motion-studio/schema'

import type { IRChild, IRElement, IRValue } from '../../ir/ir.types'

/**
 * `IRElement` → JSX — EXPORT_ENGINE.md § React, the example's formatting read as rules. The IR decided
 * everything semantic already, so this file only serialises: attribute order, line breaking, whitespace
 * between inline children, and the escapes JSX text needs.
 *
 * Nothing here consults the registry, the theme or the options. A printer that had to would be a second
 * decision site, which is the whole reason the IR exists.
 */
export const INDENT = '  '

/** Prettier's `printWidth` and ours — `packages/config/biome.json`, `lineWidth: 100`. */
export const PRINT_WIDTH = 100

/** ADR-233: React's `CSSProperties` has no index signature, so a custom property needs the annotation. */
export const STYLE_TYPE = 'CSSProperties'

export const REACT_TYPE_IMPORT = { from: 'react', named: [STYLE_TYPE], typeOnly: true } as const

const quote = (value: string): string => `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`

/** `{`, `}`, `<` and `>` end a JSX text run, so a value carrying one travels as a string expression. */
const text = (value: string): string => (/[<>{}]/.test(value) ? `{${quote(value)}}` : value)

function attribute(name: string, value: IRValue): string {
  switch (value.kind) {
    case 'expression':
      return `${name}={${value.code}}`
    case 'reference':
      return `${name}={${value.name}}`
    case 'literal':
      if (typeof value.value === 'boolean') {
        // `aria-hidden` rather than `aria-hidden={true}`: the doc's decorative-layer example, and JSX's
        // own shorthand. `false` has to be written out, because omitting it would say the opposite.
        return value.value ? name : `${name}={false}`
      }

      return typeof value.value === 'number'
        ? `${name}={${value.value}}`
        : styleQuoted(name, value.value)
  }
}

/** Double quotes in JSX attributes — unless the value carries one, which is what braces are for. */
const styleQuoted = (name: string, value: string): string =>
  value.includes('"') ? `${name}={${quote(value)}}` : `${name}="${value}"`

const styleAttribute = (cssVars: Readonly<Record<string, string>>): string => {
  const entries = Object.entries(cssVars).map(
    ([property, value]) => `${quote(property)}: ${quote(value)}`,
  )

  return `style={{ ${entries.join(', ')} } as ${STYLE_TYPE}}`
}

/**
 * Declared attributes in the order the IR set them, then `className`, then `style`. That is the order
 * EXPORT_ENGINE.md's example prints in both of its elements — `aria-hidden className style` on the
 * aurora, the motion props before `className` on the animated one — from one rule rather than two.
 */
function attributesOf(element: IRElement): readonly string[] {
  return [
    ...(element.key === undefined ? [] : [`key=${quote(element.key)}`]),
    ...Object.entries(element.attributes).map(([name, value]) => attribute(name, value)),
    ...(element.classNames.length === 0 ? [] : [`className="${element.classNames.join(' ')}"`]),
    ...(element.cssVars === undefined ? [] : [styleAttribute(element.cssVars)]),
  ]
}

/**
 * The JSON-LD the block asked for — ADR-194. The printer knows the shape because the descriptor names a
 * type rather than handing over a string, and the entries come from the block's own content props.
 */
const STRUCTURED_DATA_ENTRIES: Readonly<Record<StructuredDataType, string>> = {
  FAQPage: 'mainEntity',
  BreadcrumbList: 'itemListElement',
}

export function structuredDataScript(type: StructuredDataType): IRElement {
  const payload = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': type,
    [STRUCTURED_DATA_ENTRIES[type]]: [],
  })

  return {
    kind: 'element',
    tag: 'script',
    classNames: [],
    attributes: {
      type: { kind: 'literal', value: 'application/ld+json' },
      dangerouslySetInnerHTML: { kind: 'expression', code: `{ __html: ${quote(payload)} }` },
    },
    children: [],
  }
}

const childrenOf = (element: IRElement): readonly IRChild[] =>
  element.structuredData === undefined
    ? element.children
    : [...element.children, structuredDataScript(element.structuredData)]

/**
 * JSX collapses whitespace that contains a newline, so a space between two inline children survives
 * being broken onto separate lines only as `{' '}`. Getting this wrong produces output that renders
 * visibly differently from the canvas, which is why it is a rule rather than a nicety.
 */
const SPACE = "{' '}"

function childLines(children: readonly IRChild[], depth: number): readonly string[] {
  const pad = INDENT.repeat(depth)
  const lines: string[] = []

  children.forEach((child, index) => {
    if (child.kind === 'expression') {
      lines.push(`${pad}{${child.code}}`)

      return
    }

    if (child.kind === 'element') {
      lines.push(...noteLines(child, pad), printElement(child, depth))

      return
    }

    const trimmed = child.value.trim()
    const before = index > 0 && /^\s/.test(child.value)
    const after = index < children.length - 1 && /\s$/.test(child.value)

    if (trimmed === '') {
      if (before && after) {
        lines.push(`${pad}${SPACE}`)
      }

      return
    }

    lines.push(
      ...(before ? [`${pad}${SPACE}`] : []),
      `${pad}${text(trimmed)}`,
      ...(after ? [`${pad}${SPACE}`] : []),
    )
  })

  return lines
}

/** The descriptor's `notes`, verbatim — `{/* … *\/}` in child position, where JSX takes a comment. */
export const noteLines = (element: IRElement, pad: string): readonly string[] =>
  (element.notes ?? []).map((note) => `${pad}{/* ${note} */}`)

export function printElement(element: IRElement, depth: number): string {
  const pad = INDENT.repeat(depth)
  const attributes = attributesOf(element)
  const children = childrenOf(element)
  const head = `<${element.tag}${attributes.length === 0 ? '' : ` ${attributes.join(' ')}`}`
  const close = children.length === 0 ? ' />' : '>'
  const single = `${pad}${head}${close}`
  const only = children[0]

  if (single.length <= PRINT_WIDTH) {
    if (children.length === 0) {
      return single
    }

    if (children.length === 1 && only?.kind === 'text') {
      const inline = `${single}${text(only.value.trim())}</${element.tag}>`

      if (inline.length <= PRINT_WIDTH) {
        return inline
      }
    }
  }

  const open =
    single.length <= PRINT_WIDTH
      ? single
      : [
          `${pad}<${element.tag}`,
          ...attributes.map((entry) => `${pad}${INDENT}${entry}`),
          `${pad}${close.trim()}`,
        ].join('\n')

  return children.length === 0
    ? open
    : [open, ...childLines(children, depth + 1), `${pad}</${element.tag}>`].join('\n')
}

/** Whether any element in the tree carries custom properties, which is what pulls in the React type. */
export function needsStyleType(element: IRElement): boolean {
  if (element.cssVars !== undefined && Object.keys(element.cssVars).length > 0) {
    return true
  }

  return element.children.some((child) => child.kind === 'element' && needsStyleType(child))
}
