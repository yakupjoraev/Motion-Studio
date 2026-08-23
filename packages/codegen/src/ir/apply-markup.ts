import type { MarkupChild, MarkupElement } from '@motion-studio/schema'

import { mergeAndSort } from './tailwind/merge-classes'

import type { IRChild, IRElement } from './ir.types'

/**
 * What a block's producer returns, turned into what a printer reads — ADR-249. Two things happen here
 * and nothing else: every `slot` becomes the elements the document put in it, and every element's
 * class list is ordered and conflict-merged.
 *
 * The ordering is done here rather than in the producer because it is a property of the output
 * (ADR-224's variant-major table) and not of any one block, and because a producer calling its own
 * `cva` cannot know what a motion preset added to the same element.
 */
export interface MarkupApplication {
  readonly root: IRElement
  /** Every class the subtree carries, for the HTML target's stylesheet. */
  readonly classes: readonly string[]
}

export function applyMarkup(
  produced: MarkupElement,
  slots: ReadonlyMap<string, readonly IRChild[]>,
): MarkupApplication {
  const classes: string[] = []
  const root = element(produced, slots, classes)

  return { root, classes }
}

function element(
  node: MarkupElement,
  slots: ReadonlyMap<string, readonly IRChild[]>,
  classes: string[],
): IRElement {
  const classNames = mergeAndSort(node.classNames)
  const { slotGate: _gate, ...rest } = node

  classes.push(...classNames)

  return { ...rest, classNames, children: childrenOf(node.children, slots, classes) }
}

/** A gated element survives only when the slot it names is on the side of the gate it asked for. */
const gateOpen = (node: MarkupElement, slots: ReadonlyMap<string, readonly IRChild[]>): boolean => {
  if (node.slotGate === undefined) {
    return true
  }

  const list = slots.get(node.slotGate.slot) ?? []
  const filled =
    node.slotGate.index === undefined ? list.length > 0 : list[node.slotGate.index] !== undefined

  return node.slotGate.when === 'filled' ? filled : !filled
}

function childrenOf(
  nodes: readonly MarkupChild[],
  slots: ReadonlyMap<string, readonly IRChild[]>,
  classes: string[],
): readonly IRChild[] {
  const resolved: IRChild[] = []

  for (const node of nodes) {
    if (node.kind === 'slot') {
      // An unfilled slot contributes nothing: a container with no children is a container with no
      // children, and the alternative is markup that says so out loud in somebody's page.
      const filled = slots.get(node.name) ?? []
      const one = node.index === undefined ? undefined : filled[node.index]

      resolved.push(...(node.index === undefined ? filled : one === undefined ? [] : [one]))

      continue
    }

    if (node.kind !== 'element') {
      resolved.push(node)

      continue
    }

    if (gateOpen(node, slots)) {
      resolved.push(element(node, slots, classes))
    }
  }

  return resolved
}
