import type { BlockCategory, BlockDefinition, BlockId } from '@motion-studio/schema'
import type { ComponentType } from 'react'

/**
 * One block's component, without the other seventy-one.
 *
 * `renderRegistry` is the studio's entry point and it is eager on purpose — a canvas holds any block
 * and ADR-196 measured that splitting a category costs a request and a skeleton for nothing there.
 * The public gallery is the opposite case: a card shows one block, and importing the map to reach it
 * would put the whole catalogue's markup on a page that renders a twentieth of it.
 *
 * The split is by **category** rather than by block. Nine loaders instead of seventy-two, derived
 * from a field the definition already carries, so there is no second list of block ids to drift from
 * the first — which is the failure `registryParity` exists to catch, avoided here by not creating the
 * opportunity.
 */
const LOADERS: Readonly<Record<BlockCategory, () => Promise<Record<string, unknown>>>> = {
  layout: () => import('./layout/components'),
  hero: () => import('./hero/components'),
  content: () => import('./content/components'),
  marketing: () => import('./marketing/components'),
  navigation: () => import('./navigation/components'),
  interactive: () => import('./interactive/components'),
  data: () => import('./data/components'),
  forms: () => import('./forms/components'),
  effects: () => import('./effects/components'),
}

export class MissingBlockComponentError extends Error {
  constructor(id: string, category: string) {
    super(`No component is registered as “${id}” in the ${category} category`)
    this.name = 'MissingBlockComponentError'
  }
}

/**
 * A promise for the component, and deliberately **not** a `lazy()` around one.
 *
 * Fourteen of the seventy-two are already `lazy` in their category's map — the whole effects
 * category, plus `hero-video` — and a `lazy` whose loader resolves to another `lazy` is the one
 * shape React rejects outright: "Lazy element type must resolve to a class or function." Returning
 * the map's own value keeps whatever it is, lazy or not, and the caller renders it inside a
 * `Suspense` that handles both the same way.
 *
 * The props type is `Record<string, unknown>` for the reason `BlockComponent` is `never`: the caller
 * holds props this map cannot narrow, and it has parsed them against the block's own schema before
 * getting here.
 */
export async function loadBlockComponent(
  category: BlockCategory,
  id: BlockId,
): Promise<ComponentType<Record<string, unknown>>> {
  const module = await LOADERS[category]()
  const components = module['components'] as Record<string, ComponentType<never>> | undefined
  const component = components?.[id]

  if (component === undefined) {
    throw new MissingBlockComponentError(id, category)
  }

  return component as ComponentType<Record<string, unknown>>
}

/**
 * The same split for metadata. `blockRegistry` is 44.5 kB gzip of definitions (ADR-292) and the one
 * thing a public detail page needs from it is a single block's Zod schema — to parse the query
 * string, which `prompts/52` is right to call untrusted input.
 *
 * Metadata modules, not component modules: ADR-107 keeps the two apart so `codegen` can read a
 * definition under `node`, and importing the wrong one here would quietly undo that for this app.
 */
const DEFINITION_LOADERS: Readonly<Record<BlockCategory, () => Promise<Record<string, unknown>>>> =
  {
    layout: () => import('./layout/definitions'),
    hero: () => import('./hero/definitions'),
    content: () => import('./content/definitions'),
    marketing: () => import('./marketing/definitions'),
    navigation: () => import('./navigation/definitions'),
    interactive: () => import('./interactive/definitions'),
    data: () => import('./data/definitions'),
    forms: () => import('./forms/definitions'),
    effects: () => import('./effects/definitions'),
  }

export class MissingBlockDefinitionError extends Error {
  constructor(id: string, category: string) {
    super(`No block is defined as “${id}” in the ${category} category`)
    this.name = 'MissingBlockDefinitionError'
  }
}

export async function loadBlockDefinition(
  category: BlockCategory,
  id: BlockId,
): Promise<BlockDefinition> {
  const module = await DEFINITION_LOADERS[category]()
  const definitions = module['definitions'] as Record<string, BlockDefinition> | undefined
  const definition = definitions?.[id]

  if (definition === undefined) {
    throw new MissingBlockDefinitionError(id, category)
  }

  return definition
}
