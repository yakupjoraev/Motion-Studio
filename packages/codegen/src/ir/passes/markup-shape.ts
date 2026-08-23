import type { MarkupChild, MarkupElement } from '@motion-studio/schema'

/**
 * The *shape* of a produced subtree — ADR-252, which is what ADR-228 called the shape of a node once
 * the markup stopped being a declaration.
 *
 * Everything that changes the printed body is here: the tags, the classes, the attribute names, the
 * order. Everything a prop can travel into as a value is not: a text run and an attribute's value are
 * erased, because two cards that differ only in their price print the same body with one prop.
 */
const shapeOf = (node: MarkupChild): unknown => {
  if (node.kind === 'text' || node.kind === 'expression') {
    return 'value'
  }

  if (node.kind === 'slot') {
    return { slot: node.name, index: node.index ?? null }
  }

  return {
    tag: node.tag,
    classNames: node.classNames,
    attributes: Object.keys(node.attributes).sort(),
    cssVars: Object.keys(node.cssVars ?? {}).sort(),
    gate: node.slotGate ?? null,
    children: node.children.map(shapeOf),
  }
}

export const markupShape = (root: MarkupElement): string => JSON.stringify(shapeOf(root))

/**
 * Whether a prop's value reaches the printed body as a value a reference can replace.
 *
 * A producer bakes what it reads — `txt(props.headline)` — so a prop that is going to become a
 * component's prop has to be findable in the output verbatim. One that is not (a value the producer
 * folded into a longer string, or read to choose a class) cannot be lifted, and the group it would
 * have shared a component with prints separately instead of printing somebody else's text.
 */
export function carriesValue(root: MarkupElement, value: unknown): boolean {
  if (value === undefined || value === null || typeof value === 'object') {
    return false
  }

  const printed = String(value)

  if (printed === '') {
    return false
  }

  const visit = (node: MarkupChild): boolean => {
    if (node.kind === 'text') {
      return node.value === printed
    }

    if (node.kind !== 'element') {
      return false
    }

    const inAttributes = Object.values(node.attributes).some(
      (attribute) => attribute.kind === 'literal' && String(attribute.value) === printed,
    )

    return inAttributes || node.children.some(visit)
  }

  return visit(root)
}
