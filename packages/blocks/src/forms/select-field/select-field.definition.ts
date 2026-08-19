import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import { FIELD_CONTROLS, FORMS_FRAME_CONTROLS } from '../forms.controls'
import { OPTION_MAX_LENGTH, PLACEHOLDER_MAX_LENGTH } from '../forms.schema'

import { selectFieldMotion } from './select-field.motion'
import { MAX_OPTIONS, selectFieldSchema } from './select-field.schema'

export const selectFieldDefinition = defineBlock({
  id: blockId('select-field'),
  name: 'Select field',
  description: 'A choice from a list, wired the same way the text field is.',
  category: 'forms',
  tags: ['form', 'select', 'field', 'dropdown', 'choice'],
  icon: 'chevron-down',

  propsSchema: selectFieldSchema,
  defaults: selectFieldSchema.parse({}),
  previewProps: selectFieldSchema.parse({ required: true, defaultValue: 'next' }),

  slots: [],

  controls: [
    {
      id: 'content',
      label: 'Content',
      controls: [
        ...FIELD_CONTROLS,
        {
          path: 'placeholder',
          kind: 'text',
          label: 'Placeholder',
          hint: 'What the trigger shows before a choice is made',
          options: { maxLength: PLACEHOLDER_MAX_LENGTH },
        },
      ],
    },
    {
      id: 'options',
      label: 'Options',
      controls: [
        {
          path: 'options',
          kind: 'list',
          label: 'Options',
          hint: 'A value and the word the reader sees. The value cannot be empty',
          options: {
            max: MAX_OPTIONS,
            labelKey: 'label',
            sortable: true,
            itemTemplate: { value: 'option', label: 'Option' },
            itemControls: [
              {
                path: 'label',
                kind: 'text',
                label: 'Label',
                options: { maxLength: OPTION_MAX_LENGTH },
              },
              {
                path: 'value',
                kind: 'text',
                label: 'Value',
                options: { maxLength: OPTION_MAX_LENGTH },
              },
            ],
          },
        },
        {
          path: 'defaultValue',
          kind: 'text',
          label: 'Starts selected',
          hint: 'An option’s value. Empty starts on the placeholder',
          options: { maxLength: OPTION_MAX_LENGTH },
        },
      ],
    },
    {
      id: 'style',
      label: 'Style',
      controls: [...FORMS_FRAME_CONTROLS],
    },
  ],

  capabilities: {
    resizable: false,
    fullWidth: true,
    requiresBackdrop: false,
    supportsMotion: ['entrance'],
    costClass: 'cheap',
  },

  defaultMotion: selectFieldMotion,

  codegen: {
    tag: 'div',
    dependencies: { '@radix-ui/react-select': '^2.3.7' },
    imports: [{ from: '@radix-ui/react-select', named: ['Select'] }],
    client: {
      kind: 'always',
      reason:
        'Radix Select holds the open state and the chosen value, and useId generates the wiring ids.',
    },
    notes: [
      'The field is uncontrolled. Read the value from the form, or drop it inside the contact form block.',
    ],
  },

  a11y: {
    notes: [
      'The trigger is a button, and a label’s htmlFor is not part of a button’s accessible name computation — so it carries aria-labelledby naming the label element and itself.',
      'Naming itself as well as the label is deliberate: the name becomes "Export target, Next.js", so the reader hears the field and the current value rather than only the field.',
      'The label’s htmlFor still points at the trigger, so clicking the label reaches the control the way it does on a text field.',
      'aria-describedby, aria-invalid and aria-required behave exactly as they do on the text field, because the wiring is one implementation shared by both.',
      'Radix owns the keyboard: Space or Enter and the arrows open the list, typing jumps to a match, Escape closes it, and focus returns to the trigger.',
      'The tick beside the chosen option is aria-hidden — Radix already puts aria-selected on the option, and a glyph saying the same thing says it twice.',
    ],
  },
})
