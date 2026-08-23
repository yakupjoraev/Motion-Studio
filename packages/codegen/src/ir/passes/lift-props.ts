import type { IRChild, IRElement } from '../ir.types'

/**
 * The values a shared component takes as props, lifted out of the body it was built from — ADR-252.
 *
 * A producer bakes what it reads, so the body of three cards built from the first one says "Starter"
 * three times. Rule 3 already decided that these nodes differ only in values a reference can replace
 * — `carriesValue` is what proved it — so this is the substitution: the text and attributes carrying
 * the source node's value for a differing prop become `{name}`, and every instance passes its own.
 */
const lifted = (
  value: unknown,
  props: Readonly<Record<string, unknown>>,
  names: readonly string[],
): string | undefined =>
  names.find((name) => {
    const own = props[name]

    return own !== undefined && own !== null && String(own) !== '' && String(own) === String(value)
  })

function element(
  node: IRElement,
  props: Readonly<Record<string, unknown>>,
  names: readonly string[],
): IRElement {
  const attributes = Object.fromEntries(
    Object.entries(node.attributes).map(([attribute, value]) => {
      if (value.kind !== 'literal') {
        return [attribute, value]
      }

      const name = lifted(value.value, props, names)

      return [attribute, name === undefined ? value : { kind: 'reference' as const, name }]
    }),
  )

  const children: IRChild[] = node.children.map((child) => {
    if (child.kind === 'element') {
      return element(child, props, names)
    }

    if (child.kind !== 'text') {
      return child
    }

    const name = lifted(child.value, props, names)

    return name === undefined ? child : { kind: 'expression' as const, code: name }
  })

  return { ...node, attributes, children }
}

export const liftProps = (
  root: IRElement,
  props: Readonly<Record<string, unknown>>,
  names: readonly string[],
): IRElement => (names.length === 0 ? root : element(root, props, [...names].sort()))
