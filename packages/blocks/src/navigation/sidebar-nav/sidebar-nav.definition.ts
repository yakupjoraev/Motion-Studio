import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import { HEADING_LEVELS } from '../../marketing/marketing.schema'
import {
  ACTIVE_HREF_CONTROL,
  NAV_FRAME_CONTROLS,
  NAV_LINK_ITEM_CONTROLS,
} from '../navigation.controls'
import { ICON_NAME_MAX_LENGTH, NAV_LABEL_MAX_LENGTH } from '../navigation.schema'

import { sidebarNavMotion } from './sidebar-nav.motion'
import { MAX_SIDEBAR_GROUPS, MAX_SIDEBAR_ITEMS, sidebarNavSchema } from './sidebar-nav.schema'

export const sidebarNavDefinition = defineBlock({
  id: blockId('sidebar-nav'),
  name: 'Sidebar nav',
  description: 'Labelled groups of links, collapsible, with a glyphs-only rail mode.',
  category: 'navigation',
  tags: ['navigation', 'sidebar', 'docs', 'rail', 'groups'],
  icon: 'panel-left',

  propsSchema: sidebarNavSchema,
  defaults: sidebarNavSchema.parse({}),
  previewProps: sidebarNavSchema.parse({ activeHref: '#install' }),

  slots: [],

  controls: [
    {
      id: 'groups',
      label: 'Groups',
      controls: [
        {
          path: 'groups',
          kind: 'list',
          label: 'Groups',
          options: {
            max: MAX_SIDEBAR_GROUPS,
            labelKey: 'title',
            sortable: true,
            itemTemplate: {
              title: 'Reference',
              collapsible: true,
              items: [{ label: 'Overview', href: '#', icon: 'file' }],
            },
            itemControls: [
              {
                path: 'title',
                kind: 'text',
                label: 'Title',
                options: { maxLength: NAV_LABEL_MAX_LENGTH },
              },
              {
                path: 'collapsible',
                kind: 'switch',
                label: 'Collapsible',
                hint: 'Ignored in rail mode, where there is nowhere to put a disclosure',
              },
              {
                path: 'items',
                kind: 'list',
                label: 'Links',
                options: {
                  max: MAX_SIDEBAR_ITEMS,
                  labelKey: 'label',
                  sortable: true,
                  itemTemplate: { label: 'Overview', href: '#', icon: 'file' },
                  itemControls: [
                    ...NAV_LINK_ITEM_CONTROLS,
                    {
                      path: 'icon',
                      kind: 'icon',
                      label: 'Icon',
                      options: { maxLength: ICON_NAME_MAX_LENGTH },
                    },
                  ],
                },
              },
            ],
          },
        },
        ...ACTIVE_HREF_CONTROL,
      ],
    },
    {
      id: 'layout',
      label: 'Layout',
      controls: [
        {
          path: 'collapsed',
          kind: 'switch',
          label: 'Rail',
          hint: 'Glyphs only, names kept, and a label beside the glyph on hover and on focus',
          responsive: true,
        },
        {
          path: 'headingLevel',
          kind: 'select',
          label: 'Group heading level',
          hint: 'So the column nests under whatever heading is above it',
          options: {
            options: HEADING_LEVELS.map((level) => ({ value: level, label: `h${level}` })),
          },
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
    minWidth: 64,
  },

  defaultMotion: sidebarNavMotion,

  codegen: {
    tag: 'nav',
    dependencies: { '@radix-ui/react-collapsible': '^1.1.20' },
    imports: [{ from: '@radix-ui/react-collapsible', default: 'Collapsible' }],
    client: {
      kind: 'always',
      reason: 'useId names every group heading, and a hook cannot run in a Server Component.',
    },
  },

  a11y: {
    role: 'navigation',
    notes: [
      'One labelled navigation landmark holding role="group" sections, each named by its real heading through aria-labelledby.',
      'The current item carries aria-current="page" plus a weight change and a rule down its left edge — never colour alone.',
      'A collapsible group is a Radix Collapsible, so the trigger reports aria-expanded and the closed panel is removed from the tab order rather than merely hidden by a class.',
      'The heading is the trigger’s parent rather than its child, so a screen reader reads heading, then button, then state.',
      'In rail mode the label stays in the DOM as the link’s accessible name and the visible tag beside the glyph is aria-hidden. It appears on focus as well as on hover, so nothing is disclosed by hover alone.',
      'Rail mode ignores the collapsible flag: a 64 px column has nowhere to put a disclosure, and hiding links behind one would leave a glyphs-only column with nothing in it.',
    ],
  },
})
