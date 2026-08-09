'use client'

import type { ControlGroup, NodeId } from '@motion-studio/schema'

import { BlockSection } from './block-section'

export interface StyleSectionProps {
  readonly group: ControlGroup
  readonly nodeIds: readonly NodeId[]
}

export function StyleSection({ group, nodeIds }: StyleSectionProps) {
  return <BlockSection group={group} id="style" label="Style" nodeIds={nodeIds} />
}
