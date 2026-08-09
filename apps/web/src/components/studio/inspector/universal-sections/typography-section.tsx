'use client'

import type { ControlGroup, NodeId } from '@motion-studio/schema'

import { BlockSection } from './block-section'

export interface TypographySectionProps {
  readonly group: ControlGroup
  readonly nodeIds: readonly NodeId[]
}

export function TypographySection({ group, nodeIds }: TypographySectionProps) {
  return <BlockSection group={group} id="typography" label="Typography" nodeIds={nodeIds} />
}
