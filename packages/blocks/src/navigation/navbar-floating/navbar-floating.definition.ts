import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import { MAX_ACTIONS } from '../../marketing/marketing.schema'
import {
  ACTIVE_HREF_CONTROL,
  NAV_ACTION_ITEM_CONTROLS,
  NAV_BRAND_CONTROLS,
  NAV_FRAME_CONTROLS,
  NAV_LINK_ITEM_CONTROLS,
} from '../navigation.controls'
import { MAX_NAV_ITEMS } from '../navigation.schema'

import { navbarFloatingMotion } from './navbar-floating.motion'
import { FLOATING_SHRINK_PX, navbarFloatingSchema } from './navbar-floating.schema'

export const navbarFloatingDefinition = defineBlock({
  id: blockId('navbar-floating'),
  name: 'Floating navbar',
  description: `A detached glass pill that shrinks past ${FLOATING_SHRINK_PX} px of scroll.`,
  category: 'navigation',
  tags: ['navigation', 'navbar', 'floating', 'glass', 'pill'],
  icon: 'navbar',

  propsSchema: navbarFloatingSchema,
  defaults: navbarFloatingSchema.parse({}),
  previewProps: navbarFloatingSchema.parse({ activeHref: '#docs' }),

  slots: [],

  controls: [
    { id: 'brand', label: 'Brand', controls: NAV_BRAND_CONTROLS },
    {
      id: 'links',
      label: 'Links',
      controls: [
        {
          path: 'links',
          kind: 'list',
          label: 'Links',
          options: {
            max: MAX_NAV_ITEMS,
            labelKey: 'label',
            sortable: true,
            itemTemplate: { label: 'Pricing', href: '#' },
            itemControls: NAV_LINK_ITEM_CONTROLS,
          },
        },
        ...ACTIVE_HREF_CONTROL,
      ],
    },
    {
      id: 'actions',
      label: 'Actions',
      controls: [
        {
          path: 'actions',
          kind: 'list',
          label: 'Buttons',
          options: {
            max: MAX_ACTIONS,
            labelKey: 'label',
            sortable: true,
            itemTemplate: { label: 'Start building', href: '#', variant: 'primary' },
            itemControls: NAV_ACTION_ITEM_CONTROLS,
          },
        },
      ],
    },
    { id: 'frame', label: 'Frame', controls: NAV_FRAME_CONTROLS },
  ],

  capabilities: {
    resizable: false,
    fullWidth: true,
    // A glass pill over a flat page is a grey pill. The inspector says so before the user sees it.
    requiresBackdrop: true,
    supportsMotion: ['entrance'],
    costClass: 'cheap',
  },

  defaultMotion: navbarFloatingMotion,

  codegen: {
    tag: 'nav',
    dependencies: { '@radix-ui/react-dialog': '^1.1.23' },
    imports: [{ from: '@radix-ui/react-dialog', default: 'Dialog' }],
    client: {
      kind: 'always',
      reason: 'The pill shrinks from a scroll listener, and the drawer below md is a Radix Dialog.',
    },
    notes: [
      `The scrolled state is a data-scrolled attribute written past ${FLOATING_SHRINK_PX} px of scroll. Keep the scroll listener passive and off React state, or the bar costs a render per frame.`,
    ],
  },

  a11y: {
    role: 'navigation',
    notes: [
      'One labelled navigation landmark, and the label is a prop so a page with two navigations reads as two.',
      'The shrink is padding and shadow only — no transform on the links, so nothing moves out from under a pointer or a magnifier.',
      'Under reduced motion the transition collapses to zero and the scrolled treatment still applies: a state change without a movement.',
      'Below sm the links move into the drawer, which is a Radix Dialog with a focus trap, Esc to close, and focus returned to its trigger.',
      'The current page carries aria-current="page" plus a weight change and a rule under the label — never colour alone.',
    ],
  },
})
