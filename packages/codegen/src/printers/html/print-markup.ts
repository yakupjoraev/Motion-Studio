import type { StructuredDataType } from '@motion-studio/schema'

import type { IRChild, IRElement, IRValue } from '../../ir/ir.types'
import { type IRWarning, warning } from '../../warnings'

import {
  BOOLEAN_ATTRIBUTES,
  HTML_ATTRIBUTES,
  MOTION_PROPS,
  RENAMED,
  SVG_ATTRIBUTES,
  VOID_TAGS,
} from './attribute-names'
import { FEATURE_ATTRIBUTES, type ScriptFeature } from './print-scripts'

/**
 * `IRElement` → HTML. The IR decided everything semantic already, so this file serialises and drops:
 * a Motion prop is not an attribute, and writing `whileInView="visible"` into a document with no React
 * in it would produce markup that validates as nonsense and does nothing.
 *
 * What is dropped is dropped by name. An attribute that is neither a known HTML attribute nor a known
 * Motion prop is reported, because the alternative is a content prop that vanishes between the canvas
 * and the file the user opens.
 */
const INDENT = '  '

const escapeText = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const escapeAttribute = (value: string): string => escapeText(value).replace(/"/g, '&quot;')

const STRUCTURED_DATA_ENTRIES: Readonly<Record<StructuredDataType, string>> = {
  FAQPage: 'mainEntity',
  BreadcrumbList: 'itemListElement',
}

export interface MarkupContext {
  /** Element → the classes `approximateMotion` added, by identity. */
  readonly extraClasses: ReadonlyMap<IRElement, readonly string[]>
  readonly warnings: IRWarning[]
  readonly usedClasses: Set<string>
  readonly features: Set<ScriptFeature>
}

/** `motion.section` is a React component; the element under it is a `<section>`. */
const tagOf = (element: IRElement): string => element.tag.replace(/^motion\./, '')

function attributeValue(name: string, value: IRValue): string | undefined {
  switch (value.kind) {
    case 'literal':
      if (typeof value.value !== 'boolean') {
        return String(value.value)
      }

      // Only a real boolean attribute takes the presence form. `aria-expanded="false"` is a state a
      // screen reader reads, and omitting it says the opposite of what the document meant.
      if (!BOOLEAN_ATTRIBUTES.has(name)) {
        return String(value.value)
      }

      return value.value ? '' : undefined
    // A reference or an expression is JavaScript. Under `singleFile` — which the HTML target
    // resolves, ADR-237 — no component takes props, so the only producers left are Motion's.
    case 'expression':
    case 'reference':
      return undefined
  }
}

function attributesOf(element: IRElement, context: MarkupContext): readonly string[] {
  const printed: string[] = []

  for (const [name, value] of Object.entries(element.attributes)) {
    const attribute = RENAMED[name] ?? name
    const known =
      HTML_ATTRIBUTES.has(attribute) ||
      SVG_ATTRIBUTES.has(attribute) ||
      attribute.startsWith('data-') ||
      attribute.startsWith('aria-')

    if (!known) {
      if (!MOTION_PROPS.has(name)) {
        context.warnings.push(
          warning('unsupported', `HTML export drops '${name}': it is not an HTML attribute.`),
        )
      }

      continue
    }

    const feature = FEATURE_ATTRIBUTES[attribute]

    if (feature !== undefined) {
      context.features.add(feature)
    }

    const resolved = attributeValue(attribute, value)

    if (resolved === undefined) {
      continue
    }

    printed.push(resolved === '' ? attribute : `${attribute}="${escapeAttribute(resolved)}"`)
  }

  const classNames = [...element.classNames, ...(context.extraClasses.get(element) ?? [])]

  for (const className of classNames) {
    context.usedClasses.add(className)
  }

  return [
    ...printed,
    ...(classNames.length === 0 ? [] : [`class="${classNames.join(' ')}"`]),
    ...(element.cssVars === undefined ? [] : [styleAttribute(element.cssVars)]),
  ]
}

/** `backgroundSize` is a React spelling; CSS has one name for it, and a custom property has none. */
const cssProperty = (property: string): string =>
  property.startsWith('--')
    ? property
    : property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)

const styleAttribute = (cssVars: Readonly<Record<string, string>>): string => {
  const entries = Object.entries(cssVars).map(
    ([property, value]) => `${cssProperty(property)}: ${value}`,
  )

  return `style="${escapeAttribute(entries.join('; '))}"`
}

/** The JSON-LD the block asked for — ADR-194, in the form a document with no React writes it. */
function structuredDataLines(type: StructuredDataType, pad: string): readonly string[] {
  const payload = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': type,
    [STRUCTURED_DATA_ENTRIES[type]]: [],
  })

  return [
    `${pad}<script type="application/ld+json">`,
    `${pad}${INDENT}${payload}`,
    `${pad}</script>`,
  ]
}

export function printMarkup(element: IRElement, context: MarkupContext, depth = 0): string {
  const pad = INDENT.repeat(depth)
  const tag = tagOf(element)
  const attributes = attributesOf(element, context)
  const open = `${pad}<${tag}${attributes.length === 0 ? '' : ` ${attributes.join(' ')}`}>`
  const notes = (element.notes ?? []).map((note) => `${pad}<!-- ${escapeText(note)} -->`)

  if (VOID_TAGS.has(tag)) {
    return [...notes, open].join('\n')
  }

  const children = childLines(element.children, context, depth + 1)
  const structured =
    element.structuredData === undefined
      ? []
      : structuredDataLines(element.structuredData, pad + INDENT)
  const body = [...children, ...structured]

  return [
    ...notes,
    ...(body.length === 0 ? [`${open}</${tag}>`] : [open, ...body, `${pad}</${tag}>`]),
  ].join('\n')
}

function childLines(
  children: readonly IRChild[],
  context: MarkupContext,
  depth: number,
): readonly string[] {
  const pad = INDENT.repeat(depth)
  const lines: string[] = []

  for (const child of children) {
    if (child.kind === 'element') {
      lines.push(printMarkup(child, context, depth))

      continue
    }

    // An expression child is JavaScript with no runtime to evaluate it. Under `singleFile` the IR
    // produces none, and one arriving here would be a defect worth seeing rather than a blank line.
    if (child.kind === 'expression') {
      context.warnings.push(
        warning('unsupported', `HTML export drops the expression '${child.code}'.`),
      )

      continue
    }

    const trimmed = child.value.trim()

    if (trimmed !== '') {
      lines.push(`${pad}${escapeText(trimmed)}`)
    }
  }

  return lines
}
