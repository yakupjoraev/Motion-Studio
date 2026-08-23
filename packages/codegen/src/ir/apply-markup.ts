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

  classes.push(...classNames)

  return { ...node, classNames, children: childrenOf(node.children, slots, classes) }
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
      resolved.push(...(slots.get(node.name) ?? []))

      continue
    }

    resolved.push(node.kind === 'element' ? element(node, slots, classes) : node)
  }

  return resolved
}
