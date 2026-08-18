import type { ControlDescriptor } from '@motion-studio/schema'

import type { TypedControl } from '../define-block.types'
import { optionsFrom } from '../scales'

import {
  ARIA_LABEL_MAX_LENGTH,
  BODY_MAX_LENGTH,
  CONTROL_SIZES,
  CONTROL_VARIANTS,
  ICON_NAME_MAX_LENGTH,
  type InteractiveFrameShape,
  LABEL_MAX_LENGTH,
  type LabelledFrameShape,
} from './interactive.schema'

/**
 * The controls every block in the category shares, typed against the *shape* rather than the block — the
 * device `SECTION_COPY_CONTROLS` and `NAV_FRAME_CONTROLS` both use, and it is the compiler enforcing
 * ADR-110.
 */
export const INTERACTIVE_FRAME_CONTROLS: readonly TypedControl<InteractiveFrameShape>[] = [
  { path: 'hidden', kind: 'switch', label: 'Hidden', responsive: true },
]

export const LABELLED_FRAME_CONTROLS: readonly TypedControl<LabelledFrameShape>[] = [
  {
    path: 'ariaLabel',
    kind: 'text',
    label: 'Group label',
    hint: 'What a screen reader announces for this control',
    options: { maxLength: ARIA_LABEL_MAX_LENGTH },
  },
  ...INTERACTIVE_FRAME_CONTROLS,
]

export const VARIANT_CONTROL = {
  path: 'variant',
  kind: 'segmented',
  label: 'Variant',
  options: { options: optionsFrom(CONTROL_VARIANTS) },
} as const satisfies ControlDescriptor

export const SIZE_CONTROL = {
  path: 'size',
  kind: 'segmented',
  label: 'Size',
  responsive: true,
  options: { options: optionsFrom(CONTROL_SIZES) },
} as const satisfies ControlDescriptor

/** A labelled panel with a glyph and its own text — `panelItemSchema`, inside a `list` control. */
export const PANEL_ITEM_CONTROLS: readonly ControlDescriptor[] = [
  { path: 'label', kind: 'text', label: 'Label', options: { maxLength: LABEL_MAX_LENGTH } },
  { path: 'icon', kind: 'icon', label: 'Icon', options: { maxLength: ICON_NAME_MAX_LENGTH } },
  {
    path: 'body',
    kind: 'textarea',
    label: 'Text',
    hint: 'Shown until a block is dropped into this panel',
    options: { rows: 3, maxLength: BODY_MAX_LENGTH },
  },
]

export const panelItemTemplate = (label: string) => ({ label, icon: '', body: '' })
