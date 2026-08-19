import type { ControlDescriptor } from '@motion-studio/schema'

import type { TypedControl } from '../define-block.types'
import { optionsFrom } from '../scales'

import {
  DENSITIES,
  type DataFrameShape,
  LABEL_MAX_LENGTH,
  type ScrollRegionShape,
} from './data.schema'

/**
 * The controls every block in the category shares, typed against the *shape* rather than the block — the
 * device `SECTION_COPY_CONTROLS` and `INTERACTIVE_FRAME_CONTROLS` both use, and it is the compiler
 * enforcing ADR-110.
 */
export const DATA_FRAME_CONTROLS: readonly TypedControl<DataFrameShape>[] = [
  { path: 'hidden', kind: 'switch', label: 'Hidden', responsive: true },
]

export const SCROLL_REGION_CONTROLS: readonly TypedControl<ScrollRegionShape>[] = [
  {
    path: 'regionLabel',
    kind: 'text',
    label: 'Region label',
    hint: 'What a screen reader announces when a keyboard user reaches the scroller',
    options: { maxLength: LABEL_MAX_LENGTH },
  },
  ...DATA_FRAME_CONTROLS,
]

export const DENSITY_CONTROL = {
  path: 'density',
  kind: 'segmented',
  label: 'Density',
  responsive: true,
  options: { options: optionsFrom(DENSITIES) },
} as const satisfies ControlDescriptor
