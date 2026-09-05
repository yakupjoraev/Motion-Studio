'use client'

import type { ControlGroup, NodeId } from '@motion-studio/schema'

import { useStudio } from '../../../../lib/i18n/studio-surface'

import { BlockSection } from './block-section'

export interface TypographySectionProps {
  readonly group: ControlGroup
  readonly nodeIds: readonly NodeId[]
}

export function TypographySection({ group, nodeIds }: TypographySectionProps) {
  const { panels } = useStudio()

  return (
    <BlockSection
      group={group}
      id="typography"
      label={panels.sectionTypography}
      nodeIds={nodeIds}
    />
  )
}
