import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import { optionsFrom } from '../../scales'
import { FIELD_CONTROLS, FORMS_FRAME_CONTROLS } from '../forms.controls'
import { INPUT_TYPES, NAME_MAX_LENGTH, PLACEHOLDER_MAX_LENGTH } from '../forms.schema'

import { inputFieldMotion } from './input-field.motion'
import { MULTILINE_ROWS_MAX, MULTILINE_ROWS_MIN, inputFieldSchema } from './input-field.schema'

export const inputFieldDefinition = defineBlock({
  id: blockId('input-field'),
  name: 'Input field',
  description: 'A text field with its label, hint and error wired to it.',
  category: 'forms',
  tags: ['form', 'input', 'field', 'text', 'email'],
  icon: 'form',

  propsSchema: inputFieldSchema,
  defaults: inputFieldSchema.parse({}),
  // The invalid state in the palette: it is the state authors most need to see, and the wiring is what the
  // block is for.
  previewProps: inputFieldSchema.parse({
    required: true,
    error: 'Enter a valid email address.',
  }),

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
          hint: 'Beside the label, never instead of it',
          options: { maxLength: PLACEHOLDER_MAX_LENGTH },
        },
      ],
    },
    {
      id: 'behaviour',
      label: 'Behaviour',
      controls: [
        {
          path: 'type',
          kind: 'select',
          label: 'Type',
          hint: 'Changes the keyboard a phone offers and the checks a browser runs',
          options: { options: optionsFrom(INPUT_TYPES) },
        },
        {
          path: 'autoComplete',
          kind: 'text',
          label: 'Autofill token',
          hint: 'email, name, tel, street-address. Empty turns autofill off',
          options: { maxLength: NAME_MAX_LENGTH },
        },
        {
          path: 'multiline',
          kind: 'switch',
          label: 'Multiline',
          hint: 'Renders a textarea, with the same wiring',
        },
        {
          path: 'rows',
          kind: 'stepper',
          label: 'Rows',
          options: { min: MULTILINE_ROWS_MIN, max: MULTILINE_ROWS_MAX },
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

  defaultMotion: inputFieldMotion,

  codegen: {
    tag: 'div',
    client: {
      kind: 'always',
      reason:
        'useId generates the label, hint and error ids, and a hook cannot run in a Server Component.',
    },
    notes: [
      'The field is uncontrolled. Bind it to your own form state, or drop it inside the contact form block, which does.',
    ],
  },

  a11y: {
    notes: [
      'A real label with htmlFor, never a placeholder standing in for one: a placeholder disappears the moment the reader starts typing.',
      'aria-describedby lists the hint and then the error, and only ids that are in the document — a dangling reference is a description the reader is promised and never given.',
      'aria-invalid is absent while the field is valid rather than false, so the state is announced only when it matters.',
      'The error paragraph is role="alert" and is always in the DOM, empty or not: a live region added at the same moment as its text is one most screen readers do not read.',
      'A required field says so in its label text and carries aria-required, and the label’s marking is aria-hidden so the requirement is announced once rather than twice.',
      'The ids come from useId, so two of these on one page cannot point their labels at the same control.',
    ],
  },
})
