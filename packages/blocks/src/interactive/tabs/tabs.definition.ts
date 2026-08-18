import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import { optionsFrom } from '../../scales'
import {
  LABELLED_FRAME_CONTROLS,
  PANEL_ITEM_CONTROLS,
  panelItemTemplate,
} from '../interactive.controls'

import { tabsMotion } from './tabs.motion'
import { MAX_TABS, TAB_ALIGNMENTS, TAB_ORIENTATIONS, tabsSchema } from './tabs.schema'

export const tabsDefinition = defineBlock({
  id: blockId('tabs'),
  name: 'Tabs',
  description: 'Panels behind a labelled strip, with an indicator that needs no measurement.',
  category: 'interactive',
  tags: ['tabs', 'panels', 'sections', 'switcher'],
  icon: 'layout-rows',

  propsSchema: tabsSchema,
  defaults: tabsSchema.parse({}),
  previewProps: tabsSchema.parse({}),

  slots: [
    {
      name: 'panels',
      label: 'Panels',
      accepts: '*',
      minChildren: 0,
      // The item cap, deliberately: a child with no tab to belong to is a child nothing renders (ADR-206).
      maxChildren: MAX_TABS,
      orientation: () => 'vertical',
    },
  ],

  controls: [
    {
      id: 'content',
      label: 'Content',
      controls: [
        {
          path: 'items',
          kind: 'list',
          label: 'Tabs',
          hint: 'The text of a tab is shown until a block is dropped into its panel',
          options: {
            max: MAX_TABS,
            labelKey: 'label',
            sortable: true,
            itemTemplate: panelItemTemplate('Section'),
            itemControls: PANEL_ITEM_CONTROLS,
          },
        },
      ],
    },
    {
      id: 'layout',
      label: 'Layout',
      controls: [
        {
          path: 'orientation',
          kind: 'segmented',
          label: 'Orientation',
          responsive: true,
          options: { options: optionsFrom(TAB_ORIENTATIONS) },
        },
        {
          path: 'align',
          kind: 'segmented',
          label: 'Strip width',
          hint: 'Stretch fills the width; the columns stay equal either way',
          options: { options: optionsFrom(TAB_ALIGNMENTS) },
        },
        {
          path: 'defaultTab',
          kind: 'stepper',
          label: 'Opens on',
          options: { min: 0, max: MAX_TABS - 1 },
        },
        ...LABELLED_FRAME_CONTROLS,
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

  defaultMotion: tabsMotion,

  codegen: {
    tag: 'div',
    dependencies: { '@radix-ui/react-tabs': '^1.1.21' },
    imports: [{ from: '@radix-ui/react-tabs', default: 'Tabs' }],
    client: {
      kind: 'always',
      reason:
        'Radix Tabs holds the open panel, and the indicator reads the active index from state.',
    },
  },

  a11y: {
    notes: [
      'A labelled tablist of tabs and panels wired in both directions by Radix: aria-selected on the trigger, aria-controls to the panel, and aria-labelledby back.',
      'One tab stop for the whole strip. The arrow keys move and activate, Home and End jump to the ends, and Tab from the strip lands in the open panel rather than in the next tab.',
      'The open tab is carried by weight as well as by the indicator, so the state survives both a colour-blind reader and reduced motion — where the indicator jumps instead of sliding.',
      'The indicator is aria-hidden and sits outside the tablist, because a tablist’s children are tabs.',
      'Each panel is a focus stop with a visible ring, which is what makes a keyboard reader able to scroll it.',
    ],
  },
})
