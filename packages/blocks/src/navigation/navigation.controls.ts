import type { ControlDescriptor } from '@motion-studio/schema'

import type { TypedControl } from '../define-block.types'
import { ACTION_VARIANTS, HREF_MAX_LENGTH, LABEL_MAX_LENGTH } from '../marketing/marketing.schema'
import { optionsFrom } from '../scales'

import {
  type ActiveShape,
  BRAND_MAX_LENGTH,
  type BrandShape,
  ICON_NAME_MAX_LENGTH,
  MAX_NAV_CHILDREN,
  NAV_DESCRIPTION_MAX_LENGTH,
  NAV_LABEL_MAX_LENGTH,
  type NavFrameShape,
} from './navigation.schema'

/**
 * The controls every block in the category shares, typed against the shape rather than the block — the
 * device `SECTION_COPY_CONTROLS` uses, and it is the compiler enforcing ADR-110.
 */
export const NAV_FRAME_CONTROLS: readonly TypedControl<NavFrameShape>[] = [
  {
    path: 'ariaLabel',
    kind: 'text',
    label: 'Landmark label',
    hint: 'What a screen reader announces for this navigation',
    options: { maxLength: NAV_LABEL_MAX_LENGTH },
  },
  { path: 'hidden', kind: 'switch', label: 'Hidden', responsive: true },
]

export const NAV_BRAND_CONTROLS: readonly TypedControl<BrandShape>[] = [
  {
    path: 'brandLabel',
    kind: 'text',
    label: 'Brand',
    options: { maxLength: BRAND_MAX_LENGTH },
  },
  { path: 'brandHref', kind: 'link', label: 'Brand link' },
]

export const ACTIVE_HREF_CONTROL: readonly TypedControl<ActiveShape>[] = [
  {
    path: 'activeHref',
    kind: 'text',
    label: 'Current page',
    hint: 'The href that gets aria-current. Empty means none',
    options: { maxLength: HREF_MAX_LENGTH },
  },
]

/** A leaf link inside a `list` control. */
export const NAV_LINK_ITEM_CONTROLS: readonly ControlDescriptor[] = [
  { path: 'label', kind: 'text', label: 'Label', options: { maxLength: NAV_LABEL_MAX_LENGTH } },
  { path: 'href', kind: 'link', label: 'Link' },
]

/** A top-level link, which may open one level of children. */
export const NAV_ITEM_CONTROLS: readonly ControlDescriptor[] = [
  ...NAV_LINK_ITEM_CONTROLS,
  {
    path: 'children',
    kind: 'list',
    label: 'Dropdown',
    hint: 'Leave it empty and the link stays a link',
    options: {
      max: MAX_NAV_CHILDREN,
      labelKey: 'label',
      sortable: true,
      itemTemplate: { label: 'Guides', href: '#', description: '' },
      itemControls: [
        ...NAV_LINK_ITEM_CONTROLS,
        {
          path: 'description',
          kind: 'text',
          label: 'Description',
          options: { maxLength: NAV_DESCRIPTION_MAX_LENGTH },
        },
      ],
    },
  },
]

/**
 * A social link. The accessible name is not a field: it is derived from the brand and the network, so a
 * document cannot ship an icon link named after its glyph — `socialAccessibleName`.
 */
export const SOCIAL_ITEM_CONTROLS: readonly ControlDescriptor[] = [
  { path: 'network', kind: 'text', label: 'Network', options: { maxLength: NAV_LABEL_MAX_LENGTH } },
  { path: 'href', kind: 'link', label: 'Link' },
  { path: 'icon', kind: 'icon', label: 'Icon', options: { maxLength: ICON_NAME_MAX_LENGTH } },
]

/** The compact call to action a bar carries. Same data as a marketing action, smaller geometry. */
export const NAV_ACTION_ITEM_CONTROLS: readonly ControlDescriptor[] = [
  { path: 'label', kind: 'text', label: 'Label', options: { maxLength: LABEL_MAX_LENGTH } },
  { path: 'href', kind: 'link', label: 'Link' },
  {
    path: 'variant',
    kind: 'segmented',
    label: 'Variant',
    options: { options: optionsFrom(ACTION_VARIANTS) },
  },
]
