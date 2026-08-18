import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import { INTERACTIVE_FRAME_CONTROLS } from '../interactive.controls'
import { ICON_NAME_MAX_LENGTH, LABEL_MAX_LENGTH } from '../interactive.schema'

import { commandMenuPreviewMotion } from './command-menu-preview.motion'
import {
  ALT_MAX_LENGTH,
  GROUP_MAX_LENGTH,
  HINT_MAX_LENGTH,
  MAX_COMMANDS,
  commandMenuPreviewSchema,
} from './command-menu-preview.schema'

export const commandMenuPreviewDefinition = defineBlock({
  id: blockId('command-menu-preview'),
  name: 'Command menu',
  description: 'A picture of a command palette for a landing page. Not a real one.',
  category: 'interactive',
  tags: ['command', 'palette', 'shortcuts', 'showcase', 'decorative'],
  icon: 'search',

  propsSchema: commandMenuPreviewSchema,
  defaults: commandMenuPreviewSchema.parse({}),
  previewProps: commandMenuPreviewSchema.parse({ glass: true }),

  slots: [],

  controls: [
    {
      id: 'content',
      label: 'Content',
      controls: [
        {
          path: 'placeholder',
          kind: 'text',
          label: 'Search line',
          options: { maxLength: LABEL_MAX_LENGTH },
        },
        {
          path: 'commands',
          kind: 'list',
          label: 'Rows',
          hint: 'Consecutive rows with the same group are drawn under one heading',
          options: {
            max: MAX_COMMANDS,
            labelKey: 'label',
            sortable: true,
            itemTemplate: { label: 'Command', icon: '', hint: '', group: '' },
            itemControls: [
              {
                path: 'label',
                kind: 'text',
                label: 'Label',
                options: { maxLength: LABEL_MAX_LENGTH },
              },
              {
                path: 'icon',
                kind: 'icon',
                label: 'Icon',
                options: { maxLength: ICON_NAME_MAX_LENGTH },
              },
              {
                path: 'hint',
                kind: 'text',
                label: 'Shortcut',
                options: { maxLength: HINT_MAX_LENGTH },
              },
              {
                path: 'group',
                kind: 'text',
                label: 'Group',
                options: { maxLength: GROUP_MAX_LENGTH },
              },
            ],
          },
        },
      ],
    },
    {
      id: 'accessibility',
      label: 'Accessibility',
      controls: [
        {
          path: 'alt',
          kind: 'textarea',
          label: 'Text alternative',
          hint: 'The panel is hidden from screen readers, so this sentence is what they get instead',
          options: { rows: 3, maxLength: ALT_MAX_LENGTH },
        },
      ],
    },
    {
      id: 'style',
      label: 'Style',
      controls: [
        {
          path: 'glass',
          kind: 'switch',
          label: 'Glass',
          hint: 'Needs a background behind it',
        },
        ...INTERACTIVE_FRAME_CONTROLS,
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

  defaultMotion: commandMenuPreviewMotion,

  codegen: {
    tag: 'div',
    client: {
      kind: 'never',
      reason:
        'Deliberately non-functional: no state, no handler and no input, at any prop set. It is a picture.',
    },
    notes: [
      'This is a picture of a command palette, not a command palette. If you want a working one, the panel is aria-hidden and every row is a list item — replace it rather than wiring handlers onto it.',
    ],
  },

  a11y: {
    notes: [
      'The panel is aria-hidden and a sentence of prose stands in for it: a fake widget announced as a real combobox promises a control that does nothing, which is worse than a picture.',
      'The text alternative is a required prop, so a document cannot ship the panel with nothing in its place.',
      'Nothing inside takes focus and nothing is a button, so there is no keyboard path to get wrong — a keyboard user tabs straight past it.',
      'The shortcuts are kbd elements rather than styled spans, so the markup says what they are.',
    ],
  },
})
