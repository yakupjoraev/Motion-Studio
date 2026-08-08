import type { BlockDefinition, Node } from '@motion-studio/schema'
import { clone, deepEqual, getPath, setPath } from '@motion-studio/utils'

/**
 * Which control groups hold style. Read off the block's own `controls` rather than from a list of
 * prop names, so a block that adds a style control gets it in paste-style without an edit here —
 * COMPONENT_LIBRARY.md § Adding a block groups controls, and these three groups are what "style"
 * means in the inspector.
 */
export const STYLE_GROUP_IDS: readonly string[] = ['style', 'effects', 'typography']

/** Prop path → value, for every style control the source block declares and the node has set. */
export function collectStyleProps(
  definition: BlockDefinition,
  node: Node,
): Record<string, unknown> {
  const props: Record<string, unknown> = {}

  for (const group of definition.controls) {
    if (!STYLE_GROUP_IDS.includes(group.id)) {
      continue
    }

    for (const control of group.controls) {
      const value = getPath(node.props, control.path)

      if (value !== undefined) {
        props[control.path] = value
      }
    }
  }

  return props
}

/**
 * ADR-069. A `safeParse` that succeeds proves the parse ran, not that the prop was kept: Zod strips
 * unknown keys, so a target that has never heard of `glass` parses `{ glass: true }` happily and
 * returns an object without it. Reading the path back off the parsed value is the difference.
 */
export function acceptsStyleProp(
  definition: BlockDefinition,
  props: Readonly<Record<string, unknown>>,
  path: string,
  value: unknown,
): boolean {
  // Deep, not a spread: a dotted path would otherwise write through into the node's own prop object.
  const candidate = clone(props)

  setPath(candidate, path, value)

  const parsed = definition.propsSchema.safeParse(candidate)

  return parsed.success && deepEqual(getPath(parsed.data, path), value)
}

/** The style props of `style` that this block will actually hold, in declaration order. */
export function applicableStyleProps(
  definition: BlockDefinition,
  props: Readonly<Record<string, unknown>>,
  style: Readonly<Record<string, unknown>>,
): Record<string, unknown> {
  const applicable: Record<string, unknown> = {}

  for (const [path, value] of Object.entries(style)) {
    if (acceptsStyleProp(definition, props, path, value)) {
      applicable[path] = value
    }
  }

  return applicable
}
