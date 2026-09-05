'use client'

import { controlHint, controlLabel } from '@motion-studio/blocks/i18n/translate'
import type { ControlDescriptor, NodeId } from '@motion-studio/schema'
import { ControlRenderer, ControlRow } from '@motion-studio/ui/controls'
import { memo, useMemo } from 'react'

import { useRegistryCopy } from '../../../lib/i18n/studio-surface'

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
  const copy = useRegistryCopy()
  /*
   * The descriptor the registry declares is English (ADR-365). The row and every field under it read
   * one translated copy rather than each translating its own string — `packages/ui` knows nothing
   * about locales, and it should not.
   */
  const localised = useMemo(
    (): ControlDescriptor => ({
      ...descriptor,
      label: controlLabel(copy, descriptor.label),
      ...(descriptor.hint === undefined ? {} : { hint: controlHint(copy, descriptor.hint) }),
    }),
    [copy, descriptor],
  )
  const { value, mixed, override, modified } = useControlValue(descriptor.path, nodeIds)
  const { onChange, onCommit, onReset } = useControlCommit(descriptor, nodeIds)
  const description = describeOverride(override)

  return (
    <ControlRow
      indicator={<OverrideIndicator state={override} />}
      label={localised.label}
      // § Control rows: a list is a control made of controls, so it takes the width (ADR-352).
      layout={descriptor.kind === 'list' ? 'stacked' : 'inline'}
      mixed={mixed}
      modified={modified}
      onReset={onReset}
      {...(description === undefined ? {} : { description })}
    >
      {(slot) => (
        <ControlRenderer
          descriptor={localised}
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
