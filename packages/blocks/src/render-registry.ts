import type { BlockId } from '@motion-studio/schema'
import { MotionStudioError } from '@motion-studio/utils'
import type { ComponentType } from 'react'

import { components as content } from './content/components'
import { components as hero } from './hero/components'
import { components as layout } from './layout/components'
import { DEFINITIONS } from './registry'

/**
 * `RenderRegistry` in `schema` is `Record<string, unknown>` so that package stays React-free. This is
 * the same map with the type it actually has, and this package is the only one allowed to say so.
 *
 * The props type is `never`: a caller holds a `BlockId` and props the registry cannot narrow, so it
 * casts once at the call site — `apps/web`'s `NodeRenderer` — after parsing them against the schema.
 */
export type BlockComponent = ComponentType<never>

export const renderRegistry: Readonly<Record<string, BlockComponent>> = {
  ...layout,
  ...hero,
  ...content,
}

export const PARITY_CODE = 'REGISTRY_PARITY'

export class RegistryParityError extends MotionStudioError {
  constructor(missing: readonly string[], extra: readonly string[]) {
    super(
      [
        'The block registry and the render registry disagree.',
        missing.length > 0 ? `Defined with no component: ${missing.join(', ')}.` : '',
        extra.length > 0 ? `Component with no definition: ${extra.join(', ')}.` : '',
      ]
        .filter((part) => part !== '')
        .join(' '),
      PARITY_CODE,
    )
  }
}

/** Returns the two differences rather than a boolean: a failure has to name the block. */
export function registryParity(
  ids: readonly BlockId[],
  map: Readonly<Record<string, unknown>>,
): { readonly missing: readonly string[]; readonly extra: readonly string[] } {
  const components = new Set(Object.keys(map))

  return {
    missing: ids.filter((id) => !components.has(id)),
    extra: [...components].filter((id) => !ids.includes(id as BlockId)),
  }
}

export function assertRegistryParity(): void {
  const { missing, extra } = registryParity(
    DEFINITIONS.map((definition) => definition.id),
    renderRegistry,
  )

  if (missing.length > 0 || extra.length > 0) {
    throw new RegistryParityError(missing, extra)
  }
}

// At module load in development, and as a test always: a block with no component is a blank canvas
// where a user placed something, and the first honest moment to say so is the load that caused it.
if (process.env['NODE_ENV'] !== 'production') {
  assertRegistryParity()
}
