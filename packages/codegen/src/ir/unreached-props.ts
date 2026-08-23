import type { BlockDefinition, Node } from '@motion-studio/schema'

import { type IRWarning, warning } from '../warnings'

/**
 * ADR-229. A prop that reached neither a class rule nor an attribute is named in the export report,
 * because the alternative is a page that looks finished and ships a blank section.
 */
export function reportUnreachedProps(
  node: Node,
  definition: BlockDefinition,
  consumed: readonly string[],
  passthrough: readonly string[],
  warnings: IRWarning[],
): void {
  const routed = new Set([
    ...consumed,
    ...passthrough,
    ...(definition.codegen.structuredData === undefined
      ? []
      : [definition.codegen.structuredData.enabledBy]),
  ])
  const missing = Object.keys(node.props)
    .filter((name) => !routed.has(name))
    .sort()

  if (missing.length === 0) {
    return
  }

  warnings.push(
    warning(
      'unsupported',
      `${definition.id} has no export route for ${missing.join(', ')}; its descriptor covers the root element only.`,
      node.id,
    ),
  )
}
