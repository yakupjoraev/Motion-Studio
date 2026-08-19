import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import { optionsFrom } from '../../scales'
import { FIELD_CONTROLS, FORMS_FRAME_CONTROLS } from '../forms.controls'
import { HINT_MAX_LENGTH, OPTION_MAX_LENGTH } from '../forms.schema'

import { checkboxFieldMotion } from './checkbox-field.motion'
import {
  CHOICE_LAYOUTS,
  CHOICE_MODES,
  MAX_CHOICES,
  checkboxFieldSchema,
} from './checkbox-field.schema'

export const checkboxFieldDefinition = defineBlock({
  id: blockId('checkbox-field'),
  name: 'Choice group',
  description: 'Checkboxes or radios in a fieldset, with the legend as the question.',
  category: 'forms',
  tags: ['form', 'checkbox', 'radio', 'field', 'choice'],
  icon: 'check',

  propsSchema: checkboxFieldSchema,
  defaults: checkboxFieldSchema.parse({}),
  previewProps: checkboxFieldSchema.parse({ required: true }),

  slots: [],

  controls: [
    {
      id: 'content',
      label: 'Content',
      controls: [...FIELD_CONTROLS],
    },
    {
      id: 'choices',
      label: 'Choices',
      controls: [
        {
          path: 'choices',
          kind: 'list',
          label: 'Choices',
          hint: 'A radio group takes one answer, so only the first checked choice counts',
          options: {
            max: MAX_CHOICES,
            labelKey: 'label',
            sortable: true,
            itemTemplate: {
              value: 'choice',
              label: 'Choice',
              hint: '',
              checked: false,
              disabled: false,
            },
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
              {
                path: 'hint',
                kind: 'text',
                label: 'Hint',
                hint: 'Belongs to this choice rather than to the group',
                options: { maxLength: HINT_MAX_LENGTH },
              },
              { path: 'checked', kind: 'switch', label: 'Starts checked' },
              { path: 'disabled', kind: 'switch', label: 'Disabled' },
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
          label: 'Mode',
          hint: 'Checkboxes answer “any of these”, radios answer “one of these”',
          options: { options: optionsFrom(CHOICE_MODES) },
        },
        {
          path: 'layout',
          kind: 'segmented',
          label: 'Layout',
          responsive: true,
          options: { options: optionsFrom(CHOICE_LAYOUTS) },
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

  defaultMotion: checkboxFieldMotion,

  codegen: {
    tag: 'div',
    client: {
      kind: 'always',
      reason:
        'useId generates the legend, hint, error and per-choice ids, and a hook needs a client component.',
    },
    notes: [
      'The group is uncontrolled. Read the values from the form, or drop it inside the contact form block.',
    ],
  },

  a11y: {
    notes: [
      'A fieldset with a legend, because the legend is the question: a group whose question was an ordinary paragraph above it leaves a screen reader announcing three labels and no question.',
      'Native checkbox and radio inputs, so the browser gives a radio group its single tab stop, its arrow keys and its wrap-around rather than a reimplementation of the three.',
      'aria-describedby on the fieldset lists the group’s hint and then its error; a choice with its own hint points at that hint itself, so it is not read before every other choice.',
      'aria-invalid on the fieldset only when the group is actually invalid, and the error is a role="alert" that is in the DOM before it has text.',
      'A required group says so in its legend text and every input carries aria-required, and the legend’s marking is aria-hidden so the requirement is announced once.',
      'Each choice has its own label with htmlFor, so the words beside a box are a target for the box rather than text next to it.',
    ],
  },
})
