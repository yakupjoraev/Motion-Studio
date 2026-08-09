'use client'

import type { ControlGroup as ControlGroupMeta, NodeId } from '@motion-studio/schema'

import { ControlGroup } from '../control-group'
import { ControlRowBinding } from '../control-row-binding'

export interface BlockSectionProps {
  readonly id: string
  readonly label: string
  readonly group: ControlGroupMeta
  readonly nodeIds: readonly NodeId[]
  /** Paths this section must not render — the sizing gate removes them for an unsizeable block. */
  readonly omit?: ReadonlySet<string>
}

/**
 * The body every universal section shares: the block's own controls for one group, one row each.
 * A section with nothing left to render draws nothing at all rather than an empty header.
 */
export function BlockSection({ id, label, group, nodeIds, omit }: BlockSectionProps) {
  const controls = group.controls.filter((control) => omit?.has(control.path) !== true)

  if (controls.length === 0) {
    return null
  }

  return (
    <ControlGroup id={id} label={label}>
      {controls.map((descriptor) => (
        <ControlRowBinding descriptor={descriptor} key={descriptor.path} nodeIds={nodeIds} />
      ))}
    </ControlGroup>
  )
}
