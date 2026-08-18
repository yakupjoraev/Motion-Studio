import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import { optionsFrom } from '../../scales'
import { LABELLED_FRAME_CONTROLS, SIZE_CONTROL } from '../interactive.controls'
import { ICON_NAME_MAX_LENGTH, LABEL_MAX_LENGTH } from '../interactive.schema'

import { buttonGroupMotion } from './button-group.motion'
import { GROUP_LOOKS, GROUP_MODES, MAX_GROUP_ITEMS, buttonGroupSchema } from './button-group.schema'

export const buttonGroupDefinition = defineBlock({
  id: blockId('button-group'),
  name: 'Button group',
  description: 'A segmented control: one tab stop, arrow keys between the choices.',
  category: 'interactive',
  tags: ['button', 'segmented', 'toggle', 'filter', 'group'],
  icon: 'layout-columns',

  propsSchema: buttonGroupSchema,
  defaults: buttonGroupSchema.parse({}),
  previewProps: buttonGroupSchema.parse({
    items: [
      { label: 'Monthly', icon: '' },
      { label: 'Yearly', icon: '' },
      { label: 'Lifetime', icon: '' },
    ],
    look: 'segmented',
  }),

  slots: [],

  controls: [
    {
      id: 'content',
      label: 'Content',
      controls: [
        {
          path: 'items',
          kind: 'list',
          label: 'Choices',
          options: {
            max: MAX_GROUP_ITEMS,
            labelKey: 'label',
            sortable: true,
            itemTemplate: { label: 'Choice', icon: '' },
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
            ],
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
          label: 'Selection',
          hint: 'Single is a radio group; multiple is a toolbar of pressed buttons',
          options: { options: optionsFrom(GROUP_MODES) },
        },
        {
          path: 'defaultSelected',
          kind: 'stepper',
          label: 'Starts on',
          hint: 'The index that starts selected. −1 starts with none',
          options: { min: -1, max: MAX_GROUP_ITEMS - 1 },
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
          options: { options: optionsFrom(GROUP_LOOKS) },
        },
        SIZE_CONTROL,
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

  defaultMotion: buttonGroupMotion,

  codegen: {
    tag: 'div',
    // Both primitives, because the mode picks one and ADR-208 is why there are two.
    dependencies: {
      '@radix-ui/react-radio-group': '^1.4.7',
      '@radix-ui/react-toggle-group': '^1.1.19',
    },
    imports: [
      { from: '@radix-ui/react-radio-group', default: 'RadioGroup' },
      { from: '@radix-ui/react-toggle-group', default: 'ToggleGroup' },
    ],
    client: {
      kind: 'always',
      reason: 'The primitive holds the selection and the roving tab index in state.',
    },
    notes: [
      'The selection is uncontrolled: nothing reads it yet. Wire onValueChange on the root to whatever the choice is meant to change.',
    ],
  },

  a11y: {
    role: 'radiogroup',
    notes: [
      'Single selection is a radiogroup of radios and multiple is a toolbar of pressed buttons, because those are different promises rather than two spellings of one — and it is two primitives for that reason (ADR-208).',
      'One tab stop for the whole group. In single mode the arrow keys move focus and check in one step, which is what the radio pattern requires; in multiple mode they move focus and Space presses, because pressing is the separate action.',
      'The group carries a required label, so a screen reader announces what the choices are for rather than "group".',
      'The selected choice is a surface change and a weight change as well as a colour, and aria-checked or aria-pressed is on the element besides.',
      'Glyphs are aria-hidden; the label beside each one is the accessible name.',
    ],
  },
})
