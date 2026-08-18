import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import { optionsFrom } from '../../scales'
import { INTERACTIVE_FRAME_CONTROLS, SIZE_CONTROL, VARIANT_CONTROL } from '../interactive.controls'
import { BODY_MAX_LENGTH, LABEL_MAX_LENGTH } from '../interactive.schema'

import { modalTriggerMotion } from './modal-trigger.motion'
import {
  DESCRIPTION_MAX_LENGTH,
  DIALOG_SIZES,
  TITLE_MAX_LENGTH,
  modalTriggerSchema,
} from './modal-trigger.schema'

export const modalTriggerDefinition = defineBlock({
  id: blockId('modal-trigger'),
  name: 'Modal trigger',
  description: 'A button and a real dialog: focus trapped, Esc closes, focus restored.',
  category: 'interactive',
  tags: ['modal', 'dialog', 'overlay', 'trigger'],
  icon: 'card',

  propsSchema: modalTriggerSchema,
  defaults: modalTriggerSchema.parse({}),
  // The thumbnail shows the dialog, because a picture of a closed dialog is a picture of a button.
  previewProps: modalTriggerSchema.parse({ defaultOpen: true }),

  slots: [
    {
      name: 'content',
      label: 'Dialog content',
      accepts: '*',
      minChildren: 0,
      maxChildren: 1,
      orientation: () => 'vertical',
    },
  ],

  controls: [
    {
      id: 'trigger',
      label: 'Trigger',
      controls: [
        {
          path: 'triggerLabel',
          kind: 'text',
          label: 'Button label',
          options: { maxLength: LABEL_MAX_LENGTH },
        },
        { ...VARIANT_CONTROL, path: 'triggerVariant' },
        { ...SIZE_CONTROL, path: 'triggerSize' },
      ],
    },
    {
      id: 'dialog',
      label: 'Dialog',
      controls: [
        { path: 'title', kind: 'text', label: 'Title', options: { maxLength: TITLE_MAX_LENGTH } },
        {
          path: 'description',
          kind: 'textarea',
          label: 'Description',
          hint: 'Required: a dialog is announced by its title and its description',
          options: { rows: 2, maxLength: DESCRIPTION_MAX_LENGTH },
        },
        {
          path: 'body',
          kind: 'textarea',
          label: 'Text',
          hint: 'Shown until a block is dropped into the dialog',
          options: { rows: 3, maxLength: BODY_MAX_LENGTH },
        },
        {
          path: 'closeLabel',
          kind: 'text',
          label: 'Close label',
          options: { maxLength: LABEL_MAX_LENGTH },
        },
        {
          path: 'size',
          kind: 'segmented',
          label: 'Width',
          options: { options: optionsFrom(DIALOG_SIZES) },
        },
        {
          path: 'defaultOpen',
          kind: 'switch',
          label: 'Starts open',
          hint: 'On an exported page this opens the dialog on load',
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

  defaultMotion: modalTriggerMotion,

  codegen: {
    tag: 'div',
    dependencies: { '@radix-ui/react-dialog': '^1.1.23' },
    imports: [{ from: '@radix-ui/react-dialog', default: 'Dialog' }],
    client: {
      kind: 'always',
      reason: 'Radix Dialog holds the open state, the focus trap and the dismiss handlers.',
    },
    notes: [
      'In the canvas this dialog is portalled into the block’s own frame, because a modal cannot cover the editor. The export portals to the document body and drops the frame, so the dialog covers the viewport as a dialog should — ADR-205.',
      'While the dialog is open everything outside it is aria-hidden, apart from live regions: any element carrying aria-live is exempt, so an announcer on the page keeps announcing (ADR-209).',
    ],
  },

  a11y: {
    role: 'dialog',
    notes: [
      'The dialog is labelled by its title and described by its description, both required props, because a dialog announced as "dialog" is a dialog nobody can place.',
      'Focus moves into the dialog when it opens, is trapped while it is open, and returns to the trigger when it closes — Radix’s focus scope, not ours.',
      'Esc closes it and the close button has a real label rather than a glyph, which is the half a bare × gets wrong.',
      'The rest of the page is aria-hidden while it is open, and a live region is not: an element with aria-live stays reachable, which is what keeps an announcer from going silent behind a dialog.',
      'The preview frame keeps its height whether the dialog is open or not, so opening it moves nothing on the page.',
    ],
  },
})
