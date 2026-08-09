import type { TypedControl } from '../define-block.types'
import { MAX_WIDTH_SCALE, MIN_HEIGHT_SCALE, SPACE_SCALE, optionsFrom } from '../scales'

import {
  CTA_VARIANTS,
  EYEBROW_MAX_LENGTH,
  EYEBROW_STYLES,
  HEADLINE_MAX_LENGTH,
  type HeroCopyShape,
  type HeroFrameShape,
  type HeroTrustShape,
  LABEL_MAX_LENGTH,
  MAX_ACTIONS,
  MAX_TRUST_ITEMS,
  SUBTITLE_MAX_LENGTH,
} from './hero.schema'

/**
 * The controls every hero shares, typed against the shape rather than against a block. A
 * `TypedControl<HeroCopyShape>` is assignable to `TypedControl<P>` for any `P` that declares the same
 * keys, which is the compiler checking ADR-110's rule — a control may only name a prop the block's
 * own schema has — without each block restating twenty descriptors.
 */
export const HERO_COPY_CONTROLS: readonly TypedControl<HeroCopyShape>[] = [
  {
    path: 'eyebrow',
    kind: 'text',
    label: 'Eyebrow',
    hint: 'Leave it empty to drop the line entirely',
    options: { maxLength: EYEBROW_MAX_LENGTH },
  },
  {
    path: 'eyebrowStyle',
    kind: 'segmented',
    label: 'Eyebrow style',
    options: { options: optionsFrom(EYEBROW_STYLES) },
  },
  {
    path: 'headline',
    kind: 'textarea',
    label: 'Headline',
    options: { maxLength: HEADLINE_MAX_LENGTH, rows: 2 },
  },
  {
    path: 'subtitle',
    kind: 'textarea',
    label: 'Subtitle',
    options: { maxLength: SUBTITLE_MAX_LENGTH, rows: 3 },
  },
  {
    path: 'actions',
    kind: 'list',
    label: 'Buttons',
    options: {
      max: MAX_ACTIONS,
      labelKey: 'label',
      itemTemplate: { label: 'Learn more', href: '#', variant: 'secondary' },
      itemControls: [
        { path: 'label', kind: 'text', label: 'Label', options: { maxLength: LABEL_MAX_LENGTH } },
        { path: 'href', kind: 'link', label: 'Link' },
        {
          path: 'variant',
          kind: 'segmented',
          label: 'Variant',
          options: { options: optionsFrom(CTA_VARIANTS) },
        },
      ],
    },
  },
]

export const HERO_TRUST_CONTROL: TypedControl<HeroTrustShape> = {
  path: 'trust',
  kind: 'list',
  label: 'Trust row',
  hint: 'Short proof under the buttons — licence, pricing, a customer count',
  options: {
    max: MAX_TRUST_ITEMS,
    labelKey: 'label',
    itemTemplate: { label: 'Open source' },
    itemControls: [
      { path: 'label', kind: 'text', label: 'Label', options: { maxLength: LABEL_MAX_LENGTH } },
    ],
  },
}

/** The band's own geometry. Responsive, because RESPONSIVE_ENGINE.md § Which properties makes it so. */
export const HERO_FRAME_CONTROLS: readonly TypedControl<HeroFrameShape>[] = [
  {
    path: 'align',
    kind: 'align',
    label: 'Align',
    responsive: true,
  },
  {
    path: 'maxWidth',
    kind: 'select',
    label: 'Max width',
    responsive: true,
    options: { options: optionsFrom(MAX_WIDTH_SCALE) },
  },
  {
    path: 'padding',
    kind: 'select',
    label: 'Padding',
    responsive: true,
    options: { options: optionsFrom(SPACE_SCALE) },
  },
  {
    path: 'minHeight',
    kind: 'select',
    label: 'Min height',
    responsive: true,
    options: { options: optionsFrom(MIN_HEIGHT_SCALE) },
  },
  { path: 'hidden', kind: 'switch', label: 'Hidden', responsive: true },
]
