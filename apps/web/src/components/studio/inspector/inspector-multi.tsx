'use client'

import { blockRegistry } from '@motion-studio/blocks'
import type { BlockDefinition, NodeId } from '@motion-studio/schema'
import { useMemo } from 'react'

import { useStudioStore } from '../../../store/editor-store'

import { BlockInspector } from './block-inspector'

export interface InspectorMultiProps {
  readonly nodeIds: readonly NodeId[]
}

const pathsOf = (definition: BlockDefinition): ReadonlySet<string> =>
  new Set(definition.controls.flatMap((group) => group.controls.map((control) => control.path)))

/**
 * UI_GUIDELINES.md § Multi-selection. Properties that are not on **every** selected block are hidden
 * rather than disabled: a control a user cannot act on and cannot explain is worse than an absent
 * one. What is left renders normally, and a value the selection disagrees about shows as `Mixed`.
 */
export function InspectorMulti({ nodeIds }: InspectorMultiProps) {
  const blockIds = useStudioStore((state) =>
    nodeIds.map((id) => state.document.nodes[id]?.blockId ?? '').join(' '),
  )

  const shared = useMemo(() => {
    const definitions = blockIds
      .split(' ')
      .filter((one) => one !== '')
      .map((one) => blockRegistry.get(one as never))
      .filter((one): one is BlockDefinition => one !== undefined)

    const [first] = definitions

    if (first === undefined) {
      return null
    }

    const [firstPaths = new Set<string>(), ...rest] = definitions.map(pathsOf)
    const paths = new Set<string>(
      [...firstPaths].filter((path) => rest.every((next) => next.has(path))),
    )

    return { definition: first, paths }
  }, [blockIds])

  if (shared === null) {
    return null
  }

  return (
    <div className="flex w-full flex-col" data-testid="inspector-multi">
      <p className="px-3 py-2 text-2xs text-foreground-subtle">
        {nodeIds.length} blocks selected. Shared properties only.
      </p>
      <BlockInspector definition={shared.definition} nodeIds={nodeIds} only={shared.paths} />
    </div>
  )
}
