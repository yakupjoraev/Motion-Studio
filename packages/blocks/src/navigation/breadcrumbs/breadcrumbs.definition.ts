import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import { optionsFrom } from '../../scales'
import { NAV_FRAME_CONTROLS, NAV_LINK_ITEM_CONTROLS } from '../navigation.controls'

import { breadcrumbsMotion } from './breadcrumbs.motion'
import {
  BREADCRUMB_SEPARATORS,
  MAX_BREADCRUMB_ITEMS,
  MIN_VISIBLE_CRUMBS,
  breadcrumbsSchema,
} from './breadcrumbs.schema'

export const breadcrumbsDefinition = defineBlock({
  id: blockId('breadcrumbs'),
  name: 'Breadcrumbs',
  description: 'An ordered trail that folds its middle into a keyboard-operable menu.',
  category: 'navigation',
  tags: ['navigation', 'breadcrumbs', 'trail', 'seo', 'overflow'],
  icon: 'chevron-right',

  propsSchema: breadcrumbsSchema,
  defaults: breadcrumbsSchema.parse({}),
  previewProps: breadcrumbsSchema.parse({}),

  slots: [],

  controls: [
    {
      id: 'trail',
      label: 'Trail',
      controls: [
        {
          path: 'items',
          kind: 'list',
          label: 'Crumbs',
          hint: 'The last one is the page the reader is on, and is not a link',
          options: {
            max: MAX_BREADCRUMB_ITEMS,
            labelKey: 'label',
            sortable: true,
            itemTemplate: { label: 'Section', href: '#' },
            itemControls: NAV_LINK_ITEM_CONTROLS,
          },
        },
      ],
    },
    {
      id: 'layout',
      label: 'Layout',
      controls: [
        {
          path: 'maxVisible',
          kind: 'stepper',
          label: 'Crumbs shown',
          hint: 'Beyond this, the middle folds into a menu',
          options: { min: MIN_VISIBLE_CRUMBS, max: MAX_BREADCRUMB_ITEMS },
        },
        {
          path: 'separator',
          kind: 'segmented',
          label: 'Separator',
          options: { options: optionsFrom(BREADCRUMB_SEPARATORS) },
        },
        {
          path: 'jsonLd',
          kind: 'switch',
          label: 'BreadcrumbList structured data',
          hint: 'Emitted by the export only. Structured data that does not match the page is a penalty',
        },
        ...NAV_FRAME_CONTROLS,
      ],
    },
  ],

  capabilities: {
    resizable: false,
    fullWidth: false,
    requiresBackdrop: false,
    supportsMotion: ['entrance'],
    costClass: 'cheap',
  },

  defaultMotion: breadcrumbsMotion,

  codegen: {
    tag: 'nav',
    dependencies: { '@radix-ui/react-dropdown-menu': '^2.1.24' },
    imports: [{ from: '@radix-ui/react-dropdown-menu', default: 'DropdownMenu' }],
    // ADR-185's rule, ADR-194's type: generated in the export, never rendered in the canvas.
    structuredData: { type: 'BreadcrumbList', enabledBy: 'jsonLd' },
    client: {
      kind: 'always',
      reason:
        'The folded middle of a long trail is a Radix DropdownMenu, which holds whether it is open.',
    },
    notes: [
      'BreadcrumbList JSON-LD is emitted beside this nav when the jsonLd prop is on. The trail has to match the page it is on, or the structured data is a penalty rather than a feature.',
    ],
  },

  a11y: {
    role: 'navigation',
    notes: [
      'One labelled navigation landmark, named Breadcrumb by default, holding an ordered list.',
      'The last crumb carries aria-current="page" and is not a link: a link to the page you are on is a tab stop that does nothing.',
      'The collapsed middle is a Radix DropdownMenu, so its trigger is a button with a real name — "Show 3 hidden levels", not "more" — and Enter, Space, the arrow keys and Esc all work.',
      'The separators are aria-hidden, so a reader hears four crumbs rather than four crumbs and three slashes.',
      'The trail wraps rather than scrolling sideways: at 360 px a scrolling trail puts the reader’s own position off screen.',
    ],
  },
})
