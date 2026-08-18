import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import { MAX_ACTIONS } from '../../marketing/marketing.schema'
import {
  ACTIVE_HREF_CONTROL,
  NAV_ACTION_ITEM_CONTROLS,
  NAV_BRAND_CONTROLS,
  NAV_FRAME_CONTROLS,
  NAV_ITEM_CONTROLS,
} from '../navigation.controls'
import { MAX_NAV_ITEMS } from '../navigation.schema'

import { navbarMotion } from './navbar.motion'
import { navbarSchema } from './navbar.schema'

export const navbarDefinition = defineBlock({
  id: blockId('navbar'),
  name: 'Navbar',
  description: 'Brand, one level of links, actions, and a focus-trapped drawer below md.',
  category: 'navigation',
  tags: ['navigation', 'navbar', 'header', 'menu', 'sticky'],
  icon: 'navbar',

  propsSchema: navbarSchema,
  defaults: navbarSchema.parse({}),
  previewProps: navbarSchema.parse({ activeHref: '#product' }),

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
            itemTemplate: { label: 'Pricing', href: '#', children: [] },
            itemControls: NAV_ITEM_CONTROLS,
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
            itemTemplate: { label: 'Sign in', href: '#', variant: 'ghost' },
            itemControls: NAV_ACTION_ITEM_CONTROLS,
          },
        },
      ],
    },
    {
      id: 'behaviour',
      label: 'Behaviour',
      controls: [
        {
          path: 'sticky',
          kind: 'switch',
          label: 'Sticky',
          hint: 'The glass treatment arrives once the page has scrolled, not at the top',
        },
        {
          path: 'skipLink',
          kind: 'switch',
          label: 'Skip link',
          hint: 'The page needs one, and this block is the thing it skips',
        },
        { path: 'skipLinkTarget', kind: 'text', label: 'Skip link target' },
        ...NAV_FRAME_CONTROLS,
      ],
    },
  ],

  capabilities: {
    resizable: false,
    fullWidth: true,
    requiresBackdrop: false,
    supportsMotion: ['entrance'],
    costClass: 'cheap',
  },

  defaultMotion: navbarMotion,

  codegen: {
    tag: 'nav',
    dependencies: {
      '@radix-ui/react-dialog': '^1.1.23',
      '@radix-ui/react-navigation-menu': '^1.2.22',
    },
    imports: [
      { from: '@radix-ui/react-navigation-menu', default: 'NavigationMenu' },
      { from: '@radix-ui/react-dialog', default: 'Dialog' },
    ],
    notes: [
      'The skip link points at #main. Give the page a <main id="main"> or turn the skip link off — a skip link that lands nowhere is worse than none.',
    ],
  },

  a11y: {
    role: 'navigation',
    notes: [
      'One labelled navigation landmark. The label is a prop because a page with two navigations needs two names.',
      'Radix NavigationMenu owns the dropdown: aria-expanded on the trigger, arrow keys along the bar, Esc to close, and an outside click to close.',
      'The drawer is a Radix Dialog, so focus is trapped inside it, Esc closes it, and focus returns to the trigger. The trigger is labelled "Open menu" and the close button "Close menu"; neither name is a prop, so no document can clear it.',
      'The skip link is the first focusable element on the page and is visible on focus rather than only on hover.',
      'A link with no children renders as a link rather than as a trigger, so nothing announces a dropdown that does not exist.',
      'The current page carries aria-current="page" plus a weight change and a rule under the label — never colour alone.',
    ],
  },
})
