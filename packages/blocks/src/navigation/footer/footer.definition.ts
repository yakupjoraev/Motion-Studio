import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import { HEADING_LEVELS } from '../../marketing/marketing.schema'
import {
  ACTIVE_HREF_CONTROL,
  NAV_BRAND_CONTROLS,
  NAV_FRAME_CONTROLS,
  NAV_LINK_ITEM_CONTROLS,
  SOCIAL_ITEM_CONTROLS,
} from '../navigation.controls'
import { MAX_SOCIALS, NAV_DESCRIPTION_MAX_LENGTH, NAV_LABEL_MAX_LENGTH } from '../navigation.schema'

import { footerMotion } from './footer.motion'
import {
  COPYRIGHT_MAX_LENGTH,
  MAX_FOOTER_COLUMNS,
  MAX_FOOTER_LINKS,
  MAX_LEGAL_LINKS,
  footerSchema,
} from './footer.schema'

export const footerDefinition = defineBlock({
  id: blockId('footer'),
  name: 'Footer',
  description: 'Brand, labelled link columns, socials, a signup slot, and a legal row.',
  category: 'navigation',
  tags: ['navigation', 'footer', 'contentinfo', 'legal', 'socials'],
  icon: 'footer',

  propsSchema: footerSchema,
  defaults: footerSchema.parse({}),
  previewProps: footerSchema.parse({ showNewsletter: false }),

  slots: [
    {
      name: 'newsletter',
      label: 'Signup',
      // The form already exists as a block, with its validation and its live region. Not a second one.
      accepts: [blockId('newsletter-form')],
      minChildren: 0,
      maxChildren: 1,
      orientation: () => 'vertical',
    },
  ],

  controls: [
    {
      id: 'brand',
      label: 'Brand',
      controls: [
        ...NAV_BRAND_CONTROLS,
        {
          path: 'tagline',
          kind: 'textarea',
          label: 'Tagline',
          options: { maxLength: NAV_DESCRIPTION_MAX_LENGTH, rows: 2 },
        },
      ],
    },
    {
      id: 'columns',
      label: 'Columns',
      controls: [
        {
          path: 'columns',
          kind: 'list',
          label: 'Columns',
          options: {
            max: MAX_FOOTER_COLUMNS,
            labelKey: 'title',
            sortable: true,
            itemTemplate: { title: 'Resources', links: [{ label: 'Overview', href: '#' }] },
            itemControls: [
              {
                path: 'title',
                kind: 'text',
                label: 'Title',
                options: { maxLength: NAV_LABEL_MAX_LENGTH },
              },
              {
                path: 'links',
                kind: 'list',
                label: 'Links',
                options: {
                  max: MAX_FOOTER_LINKS,
                  labelKey: 'label',
                  sortable: true,
                  itemTemplate: { label: 'Overview', href: '#' },
                  itemControls: NAV_LINK_ITEM_CONTROLS,
                },
              },
            ],
          },
        },
        {
          path: 'headingLevel',
          kind: 'select',
          label: 'Column heading level',
          options: {
            options: HEADING_LEVELS.map((level) => ({ value: level, label: `h${level}` })),
          },
        },
        ...ACTIVE_HREF_CONTROL,
      ],
    },
    {
      id: 'socials',
      label: 'Socials',
      controls: [
        {
          path: 'socials',
          kind: 'list',
          label: 'Links',
          hint: 'The name is built from the brand and the network — Motion Studio on GitHub',
          options: {
            max: MAX_SOCIALS,
            labelKey: 'network',
            sortable: true,
            itemTemplate: { network: 'GitHub', href: '#', icon: 'code' },
            itemControls: SOCIAL_ITEM_CONTROLS,
          },
        },
      ],
    },
    {
      id: 'legal',
      label: 'Legal',
      controls: [
        {
          path: 'copyright',
          kind: 'text',
          label: 'Copyright',
          options: { maxLength: COPYRIGHT_MAX_LENGTH },
        },
        {
          path: 'legal',
          kind: 'list',
          label: 'Links',
          options: {
            max: MAX_LEGAL_LINKS,
            labelKey: 'label',
            sortable: true,
            itemTemplate: { label: 'Cookies', href: '#' },
            itemControls: NAV_LINK_ITEM_CONTROLS,
          },
        },
        {
          path: 'showNewsletter',
          kind: 'switch',
          label: 'Signup slot',
          hint: 'Place a newsletter form in the slot; the frame appears only when one is there',
        },
        ...NAV_FRAME_CONTROLS,
      ],
    },
  ],

  capabilities: {
    resizable: false,
    fullWidth: true,
    requiresBackdrop: false,
    supportsMotion: ['entrance', 'scroll'],
    costClass: 'cheap',
  },

  defaultMotion: footerMotion,

  codegen: {
    tag: 'footer',
    client: {
      kind: 'never',
      reason:
        'Columns of links, a legal row, and a slot the signup form arrives in as its own block.',
    },
  },

  a11y: {
    role: 'contentinfo',
    notes: [
      'One labelled contentinfo landmark. Each link column is its own labelled navigation landmark, so the landmark list reads as Product, Docs, Company rather than as three anonymous navigations.',
      'A column with no links renders its heading and no landmark: an empty nav is one more thing a reader steps through to find out it is empty.',
      'Every social link is an icon link whose accessible name is derived from the brand and the network — Motion Studio on GitHub, never GitHub. The name is not a field, so no document can ship the short version.',
      'The glyphs are aria-hidden and come from our own icon set rather than from brand marks, which the 1.5 px stroke grid in DESIGN_SYSTEM.md § Iconography cannot draw.',
      'The signup slot takes newsletter-form, which already owns its label, its aria-invalid wiring and its live region.',
      'Every link in the footer is a plain tab stop in visual order — the brand, the columns, the socials, then the legal row. Nothing here needs a pointer, and nothing is disclosed by hover.',
      'Column headings take a level prop, so the footer nests under whatever heading is above it.',
    ],
  },
})
