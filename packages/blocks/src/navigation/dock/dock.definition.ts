import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import { GLASS_ESCAPE_HATCH } from '../../scales'
import {
  ACTIVE_HREF_CONTROL,
  NAV_FRAME_CONTROLS,
  NAV_LINK_ITEM_CONTROLS,
} from '../navigation.controls'
import { ICON_NAME_MAX_LENGTH } from '../navigation.schema'

import { dockMotion } from './dock.motion'
import { MAX_DOCK_ITEMS, dockSchema } from './dock.schema'

export const dockDefinition = defineBlock({
  id: blockId('dock'),
  name: 'Dock',
  description: 'A tray of labelled glyphs that swells under the cursor and under focus.',
  category: 'navigation',
  tags: ['navigation', 'dock', 'magnify', 'glass', 'shortcuts'],
  icon: 'layout-columns',

  propsSchema: dockSchema,
  defaults: dockSchema.parse({}),
  previewProps: dockSchema.parse({ activeHref: '#blocks' }),

  slots: [],

  controls: [
    {
      id: 'items',
      label: 'Items',
      controls: [
        {
          path: 'items',
          kind: 'list',
          label: 'Items',
          hint: 'The label is the accessible name and the tag above the glyph — one string, both jobs',
          options: {
            max: MAX_DOCK_ITEMS,
            labelKey: 'label',
            sortable: true,
            itemTemplate: { label: 'Canvas', href: '#', icon: 'grid' },
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
        ...ACTIVE_HREF_CONTROL,
      ],
    },
    {
      id: 'magnify',
      label: 'Magnify',
      controls: [
        {
          path: 'magnification',
          kind: 'slider',
          label: 'Peak scale',
          hint: 'How large the item under the cursor gets. Focus uses the same number',
          options: { min: 1, max: 2, step: 0.05 },
        },
        {
          path: 'reach',
          kind: 'slider',
          label: 'Reach',
          hint: 'How far either side of the cursor the swell carries, in pixels',
          options: { min: 40, max: 280, step: 10, unit: 'px' },
        },
        ...NAV_FRAME_CONTROLS,
      ],
    },
  ],

  capabilities: {
    resizable: false,
    fullWidth: false,
    // The tray is glass, so it needs something behind it to blur.
    requiresBackdrop: true,
    escapeHatch: GLASS_ESCAPE_HATCH,
    supportsMotion: ['entrance'],
    costClass: 'cheap',
  },

  defaultMotion: dockMotion,

  codegen: {
    tag: 'nav',
    client: {
      kind: 'always',
      reason:
        'The swell is a custom property per item written from a pointer listener, and the arrow keys move focus along the row.',
    },
    notes: [
      'The swell is one custom property per item, written from a throttled pointermove listener. Keep it off React state, or the dock costs a render per frame.',
    ],
  },

  a11y: {
    role: 'navigation',
    notes: [
      'One labelled navigation landmark holding a list of links. An item with no href is a button instead, because Enter on a link and Space on a button are different promises.',
      'Each item is named by a visually hidden label rather than by aria-label, so the tag above the glyph and the announced name are the same string.',
      'The magnification is decorative: the glyph and the tag are aria-hidden, and nothing a reader hears mentions it.',
      'Focus gets the same swell as hover, from the same number, so a keyboard user has the affordance a pointer user has. The ring and the surface change as well, which is what remains when the swell is switched off.',
      'Arrow keys move focus along the row and wrap; Home and End jump to the ends. The items stay individually tabbable rather than becoming a roving-tabindex group, so a reader can tab out at the next item.',
      'Under reduced motion the swell is multiplied by --ms-reduced-motion and disappears, while the hover and focus states still change.',
      'The active item carries aria-current="page" and a mark under the glyph, so the state survives the swell being off.',
    ],
  },
})
