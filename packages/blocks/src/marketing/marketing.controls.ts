import type { TypedControl, TypedControlGroup } from '../define-block.types'
import { ALIGNMENTS, optionsFrom } from '../scales'

import {
  DESCRIPTION_MAX_LENGTH,
  EYEBROW_MAX_LENGTH,
  HEADING_LEVELS,
  HEADING_MAX_LENGTH,
  type SectionCopyShape,
  type SectionFrameShape,
} from './marketing.schema'

/**
 * The section header's controls, typed against the shape rather than against a block — the same device
 * `HERO_COPY_CONTROLS` uses, and it is the compiler enforcing ADR-110: a control may only name a prop
 * the block's own schema declares, checked without twelve blocks restating five descriptors.
 */
export const SECTION_COPY_CONTROLS: readonly TypedControl<SectionCopyShape>[] = [
  {
    path: 'eyebrow',
    kind: 'text',
    label: 'Eyebrow',
    hint: 'Leave it empty to drop the line entirely',
    options: { maxLength: EYEBROW_MAX_LENGTH },
  },
  {
    path: 'heading',
    kind: 'textarea',
    label: 'Heading',
    options: { maxLength: HEADING_MAX_LENGTH, rows: 2 },
  },
  {
    path: 'description',
    kind: 'textarea',
    label: 'Description',
    options: { maxLength: DESCRIPTION_MAX_LENGTH, rows: 3 },
  },
  {
    path: 'headingLevel',
    kind: 'select',
    label: 'Heading level',
    hint: 'So the section nests under whatever heading is above it',
    options: { options: HEADING_LEVELS.map((level) => ({ value: level, label: `h${level}` })) },
  },
  {
    path: 'headingAlign',
    kind: 'segmented',
    label: 'Header align',
    responsive: true,
    options: { options: optionsFrom(ALIGNMENTS) },
  },
]

export const SECTION_FRAME_CONTROLS: readonly TypedControl<SectionFrameShape>[] = [
  { path: 'hidden', kind: 'switch', label: 'Hidden', responsive: true },
]

/** The group every marketing block opens its Content section with. */
export const sectionCopyGroup = <P extends SectionCopyShape>(): TypedControlGroup<P> => ({
  id: 'header',
  label: 'Header',
  controls: SECTION_COPY_CONTROLS as readonly TypedControl<P>[],
})
