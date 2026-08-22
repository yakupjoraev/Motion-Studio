import type { BlockDefinition } from '@motion-studio/schema'
import { getPath } from '@motion-studio/utils'

/**
 * ADR-199 evaluated per node: `whenAnyProp` asks whether any of the named props is set at these props,
 * which is the difference between a carousel with arrows and a scroll-snap strip.
 *
 * Answers with the block's own sentence when the directive is needed and `undefined` when it is not,
 * so a caller cannot use it without having something to print beside the directive.
 */
export function clientReason(
  definition: BlockDefinition,
  props: Readonly<Record<string, unknown>>,
): string | undefined {
  const boundary = definition.codegen.client

  if (boundary === undefined || boundary.kind === 'never') {
    return undefined
  }

  if (boundary.kind === 'always') {
    return boundary.reason
  }

  const active = boundary.props.some((name) => {
    const value = getPath(props, name)

    return value !== undefined && value !== false && value !== '' && value !== null
  })

  return active ? boundary.reason : undefined
}
