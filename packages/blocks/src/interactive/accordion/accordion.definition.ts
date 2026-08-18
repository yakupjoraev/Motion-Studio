import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import { optionsFrom } from '../../scales'
import {
  LABELLED_FRAME_CONTROLS,
  PANEL_ITEM_CONTROLS,
  panelItemTemplate,
} from '../interactive.controls'

import { accordionMotion } from './accordion.motion'
import {
  ACCORDION_HEADING_LEVELS,
  ACCORDION_LOOKS,
  ACCORDION_MODES,
  MAX_ACCORDION_ITEMS,
  accordionSchema,
} from './accordion.schema'

export const accordionDefinition = defineBlock({
  id: blockId('accordion'),
  name: 'Accordion',
  description: 'Disclosure rows that hold blocks, one open at a time or several.',
  category: 'interactive',
  tags: ['accordion', 'disclosure', 'collapse', 'details'],
  icon: 'list',

  propsSchema: accordionSchema,
  defaults: accordionSchema.parse({}),
  previewProps: accordionSchema.parse({}),

  slots: [
    {
      name: 'panels',
      label: 'Panels',
      accepts: '*',
      minChildren: 0,
      maxChildren: MAX_ACCORDION_ITEMS,
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
          label: 'Rows',
          hint: 'A row’s text is shown until a block is dropped into its panel',
          options: {
            max: MAX_ACCORDION_ITEMS,
            labelKey: 'label',
            sortable: true,
            itemTemplate: panelItemTemplate('Row'),
            itemControls: PANEL_ITEM_CONTROLS,
          },
        },
      ],
    },
    {
      id: 'behaviour',
      label: 'Behaviour',
      controls: [
        {
          path: 'mode',
          kind: 'segmented',
          label: 'Open',
          hint: 'Single closes the previous row; multiple leaves them all open',
          options: { options: optionsFrom(ACCORDION_MODES) },
        },
        {
          path: 'defaultOpen',
          kind: 'stepper',
          label: 'Starts open',
          hint: '−1 starts with every row closed',
          options: { min: -1, max: MAX_ACCORDION_ITEMS - 1 },
        },
      ],
    },
    {
      id: 'style',
      label: 'Style',
      controls: [
        {
          path: 'look',
          kind: 'segmented',
          label: 'Look',
          options: { options: optionsFrom(ACCORDION_LOOKS) },
        },
        {
          path: 'headingLevel',
          kind: 'select',
          label: 'Heading level',
          hint: 'One step below the heading above it, or the page skips a level',
          options: {
            options: ACCORDION_HEADING_LEVELS.map((level) => ({
              value: level,
              label: `h${level}`,
            })),
          },
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

  defaultMotion: accordionMotion,

  codegen: {
    tag: 'div',
    dependencies: { '@radix-ui/react-accordion': '^1.2.20' },
    imports: [{ from: '@radix-ui/react-accordion', default: 'Accordion' }],
    client: {
      kind: 'always',
      reason: 'Radix Accordion holds which panels are open and manages the hidden attribute.',
    },
  },

  a11y: {
    notes: [
      'Every row is a heading holding a button, which is the structure a screen reader reads as "heading, button, collapsed" — the level is a prop so the page never skips one.',
      'Radix wires aria-expanded and aria-controls both ways, and the keyboard is Space or Enter to toggle, arrows between the triggers, Home and End to the ends.',
      'Single mode is collapsible: a disclosure list with no way to close the open row is a row the reader is stuck in.',
      'The chevron is aria-hidden and rotates from the primitive’s own state, so the visible cue and the announced state cannot disagree.',
      'The label is the trigger’s accessible name; a glyph beside it is decorative.',
    ],
  },
})
