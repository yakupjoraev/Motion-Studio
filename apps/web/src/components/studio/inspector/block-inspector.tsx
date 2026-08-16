'use client'

import type { BlockDefinition, ControlDescriptor, NodeId } from '@motion-studio/schema'

import { BlockSection } from './universal-sections/block-section'
import {
  CodeSection,
  EffectsSection,
  LayoutSection,
  MotionSection,
  StyleSection,
  TypographySection,
  orderedGroups,
} from './universal-sections/index'

export interface BlockInspectorProps {
  readonly definition: BlockDefinition
  readonly nodeIds: readonly NodeId[]
  /** Multi-selection hands in the paths every selected block shares; a single selection hands none. */
  readonly only?: ReadonlySet<string> | undefined
}

const keep = (controls: readonly ControlDescriptor[], only: ReadonlySet<string> | undefined) =>
  only === undefined ? controls : controls.filter((control) => only.has(control.path))

/**
 * The whole inspector body, generated. There is no per-block code here and there is no place to put
 * any: the sections are canonical (ADR-110) and the rows come from the block's own metadata.
 */
export function BlockInspector({ definition, nodeIds, only }: BlockInspectorProps) {
  return (
    <div className="flex w-full flex-col" data-testid="block-inspector">
      {orderedGroups(definition).map(({ id, label, group }) => {
        const controls = keep(group.controls, only)

        if (controls.length === 0) {
          return null
        }

        const narrowed = { ...group, controls }

        if (id === 'layout') {
          return (
            <LayoutSection definition={definition} group={narrowed} key={id} nodeIds={nodeIds} />
          )
        }

        if (id === 'style') {
          return <StyleSection group={narrowed} key={id} nodeIds={nodeIds} />
        }

        if (id === 'typography') {
          return <TypographySection group={narrowed} key={id} nodeIds={nodeIds} />
        }

        return <BlockSection group={narrowed} id={id} key={id} label={label} nodeIds={nodeIds} />
      })}

      <MotionSection nodeIds={nodeIds} />
      <EffectsSection nodeIds={nodeIds} />
      <CodeSection nodeIds={nodeIds} />
    </div>
  )
}
