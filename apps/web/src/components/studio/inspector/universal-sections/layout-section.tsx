'use client'

import type { BlockDefinition, ControlGroup, NodeId } from '@motion-studio/schema'

import { useStudio } from '../../../../lib/i18n/studio-surface'

import { BlockSection } from './block-section'
import { sizingAllowed } from './section-order'

/** The paths that only mean something on a block that can hold a size — ADR-108. */
const SIZING_PATHS: ReadonlySet<string> = new Set(['width', 'height', 'minWidth', 'maxHeight'])

export interface LayoutSectionProps {
  readonly definition: BlockDefinition
  readonly group: ControlGroup
  readonly nodeIds: readonly NodeId[]
}

export function LayoutSection({ definition, group, nodeIds }: LayoutSectionProps) {
  const { panels } = useStudio()

  return (
    <BlockSection
      group={group}
      id="layout"
      label={panels.sectionLayout}
      nodeIds={nodeIds}
      {...(sizingAllowed(definition) ? {} : { omit: SIZING_PATHS })}
    />
  )
}
