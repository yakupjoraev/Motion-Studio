import type { IRProp, IRValue } from '../../ir/ir.types'
import type { ExportOptions } from '../../options.types'

/**
 * The props interface and the destructuring with defaults — EXPORT_ENGINE.md § React, "Props extracted
 * with defaults: immediately reusable, not a frozen snapshot".
 *
 * Every extracted prop is optional and carries the value the document had, so the component drops into
 * a page with no arguments and renders what the canvas rendered. That is what makes the pasted file
 * useful rather than a screenshot in TypeScript.
 */
const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/

const quote = (value: string): string => `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`

const key = (name: string): string => (IDENTIFIER.test(name) ? name : quote(name))

/**
 * The TypeScript type of a `json` prop, read off the value the document holds rather than declared as
 * `unknown`. A component whose `items` prop is typed `unknown[]` is a component nobody can call.
 */
export function tsType(value: unknown): string {
  if (value === null) {
    return 'null'
  }

  if (Array.isArray(value)) {
    const members = [...new Set(value.map(tsType))].sort()

    if (members.length === 0) {
      return 'unknown[]'
    }

    return members.length === 1 ? `${members[0]}[]` : `(${members.join(' | ')})[]`
  }

  switch (typeof value) {
    case 'string':
    case 'number':
    case 'boolean':
      return typeof value
    case 'object': {
      const entries = Object.entries(value)

      return entries.length === 0
        ? 'Record<string, unknown>'
        : `{ ${entries.map(([name, member]) => `${key(name)}: ${tsType(member)}`).join('; ')} }`
    }
    default:
      return 'unknown'
  }
}

/** A `json` prop's default is the value re-encoded, which is the only thing to read a type off. */
const parsed = (value: IRValue): unknown => {
  try {
    return value.kind === 'expression' ? JSON.parse(value.code) : undefined
  } catch {
    return undefined
  }
}

export const typeOfProp = (prop: IRProp): string =>
  prop.type === 'json' ? tsType(parsed(prop.defaultValue)) : prop.type

export const defaultOfProp = (prop: IRProp): string => {
  const value = prop.defaultValue

  switch (value.kind) {
    case 'literal':
      return typeof value.value === 'string' ? quote(value.value) : String(value.value)
    case 'expression':
      return value.code
    case 'reference':
      return value.name
  }
}

export const propsTypeName = (component: string): string => `${component}Props`

/** Absent for a component with no props, and for `language: 'js'`, which has nowhere to put it. */
export function printPropsInterface(
  component: string,
  props: readonly IRProp[],
  options: ExportOptions,
): string | undefined {
  if (props.length === 0 || options.language === 'js') {
    return undefined
  }

  const members = props.map((prop) => `  ${key(prop.name)}?: ${typeOfProp(prop)}`)

  return [`export interface ${propsTypeName(component)} {`, ...members, '}'].join('\n')
}

/**
 * The parameter list. One line while it fits inside the print width, and one property per line after
 * that — the same rule the element printer applies to attributes, so a reader sees one convention.
 */
export function printPropsParameter(
  component: string,
  props: readonly IRProp[],
  options: ExportOptions,
  used: number,
): string {
  if (props.length === 0) {
    return ''
  }

  const annotation = options.language === 'js' ? '' : `: ${propsTypeName(component)}`
  const entries = props.map((prop) => `${key(prop.name)} = ${defaultOfProp(prop)}`)
  const single = `{ ${entries.join(', ')} }${annotation}`

  if (used + single.length <= 100) {
    return single
  }

  return ['{', ...entries.map((entry) => `  ${entry},`), `}${annotation}`].join('\n')
}
