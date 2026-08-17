'use client'

import type { ControlDescriptor, NodeId } from '@motion-studio/schema'
import { ControlRenderer, ControlRow } from '@motion-studio/ui'
import { memo } from 'react'

import { OverrideIndicator, describeOverride } from './override-indicator'
import { useControlCommit } from './use-control-commit'
import { useControlValue } from './use-control-value'

export interface ControlRowBindingProps {
  readonly descriptor: ControlDescriptor
  readonly nodeIds: readonly NodeId[]
}

/**
 * One row: the block's metadata on the left, the generated control on the right, and the two hooks
 * that connect them to the store. Nothing here knows which block it is editing.
 */
function ControlRowBindingImpl({ descriptor, nodeIds }: ControlRowBindingProps) {
  const { value, mixed, override, modified } = useControlValue(descriptor.path, nodeIds)
  const { onChange, onCommit, onReset } = useControlCommit(descriptor, nodeIds)
  const description = describeOverride(override)

  return (
    <ControlRow
      indicator={<OverrideIndicator state={override} />}
      label={descriptor.label}
      mixed={mixed}
      modified={modified}
      onReset={onReset}
      {...(description === undefined ? {} : { description })}
    >
      {(slot) => (
        <ControlRenderer
          descriptor={descriptor}
          mixed={mixed}
          onChange={onChange}
          onCommit={onCommit}
          slot={slot}
          value={value}
        />
      )}
    </ControlRow>
  )
}

/** Memoised on the descriptor and the selection, so a drag re-renders one row and not the panel. */
export const ControlRowBinding = memo(ControlRowBindingImpl)
