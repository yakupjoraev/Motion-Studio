'use client'

import type { ControlGroup, NodeId } from '@motion-studio/schema'

import { useStudio } from '../../../../lib/i18n/studio-surface'

import { BlockSection } from './block-section'

export interface StyleSectionProps {
  readonly group: ControlGroup
  readonly nodeIds: readonly NodeId[]
}

export function StyleSection({ group, nodeIds }: StyleSectionProps) {
  const { panels } = useStudio()

  return <BlockSection group={group} id="style" label={panels.sectionStyle} nodeIds={nodeIds} />
}
