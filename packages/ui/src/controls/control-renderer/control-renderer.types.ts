import type { ControlDescriptor } from '@motion-studio/schema'

import type { ControlSlotProps } from '../control-row/index'

export interface ControlRendererProps {
  /** The block's own metadata for this control — COMPONENT_LIBRARY.md § Controls drive the inspector. */
  readonly descriptor: ControlDescriptor
  readonly value: unknown
  /** Per frame during a gesture. The consumer decides whether that is a variable or a command. */
  readonly onChange: (value: unknown) => void
  /** Once, on release. */
  readonly onCommit: (value: unknown) => void
  /** What `ControlRow` hands its child: the ids that make the row's label the control's name. */
  readonly slot?: ControlSlotProps | undefined
  readonly disabled?: boolean | undefined
  /** UI_GUIDELINES.md § Multi-selection: the selection disagrees about this property. */
  readonly mixed?: boolean | undefined
}
