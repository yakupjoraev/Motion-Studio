import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import { INTERACTIVE_FRAME_CONTROLS, SIZE_CONTROL, VARIANT_CONTROL } from '../interactive.controls'
import { ICON_NAME_MAX_LENGTH, LABEL_MAX_LENGTH } from '../interactive.schema'

import { buttonMotion } from './button.motion'
import { buttonSchema } from './button.schema'

export const buttonDefinition = defineBlock({
  id: blockId('button'),
  name: 'Button',
  description: 'A link or a button, in four variants and three sizes, with a busy state.',
  category: 'interactive',
  tags: ['button', 'cta', 'action', 'link', 'loading'],
  icon: 'zap',

  propsSchema: buttonSchema,
  defaults: buttonSchema.parse({}),
  previewProps: buttonSchema.parse({ label: 'Get started', trailingIcon: 'chevron-right' }),

  slots: [],

  controls: [
    {
      id: 'content',
      label: 'Content',
      controls: [
        { path: 'label', kind: 'text', label: 'Label', options: { maxLength: LABEL_MAX_LENGTH } },
        {
          path: 'href',
          kind: 'link',
          label: 'Link',
          hint: 'Empty makes it a button rather than a link',
        },
        {
          path: 'leadingIcon',
          kind: 'icon',
          label: 'Leading icon',
          options: { maxLength: ICON_NAME_MAX_LENGTH },
        },
        {
          path: 'trailingIcon',
          kind: 'icon',
          label: 'Trailing icon',
          options: { maxLength: ICON_NAME_MAX_LENGTH },
        },
      ],
    },
    {
      id: 'style',
      label: 'Style',
      controls: [
        VARIANT_CONTROL,
        SIZE_CONTROL,
        { path: 'fullWidth', kind: 'switch', label: 'Full width', responsive: true },
        ...INTERACTIVE_FRAME_CONTROLS,
      ],
    },
    {
      id: 'state',
      label: 'State',
      controls: [
        {
          path: 'loading',
          kind: 'switch',
          label: 'Loading',
          hint: 'Marks it busy and dims it. The click guard is the reader’s own handler',
        },
        {
          path: 'loadingLabel',
          kind: 'text',
          label: 'Busy label',
          options: { maxLength: LABEL_MAX_LENGTH },
        },
      ],
    },
  ],

  capabilities: {
    resizable: false,
    fullWidth: false,
    requiresBackdrop: false,
    // ADR-204: the hover channel is what makes the five presets prompt 40 names selectable.
    supportsMotion: ['entrance', 'hover'],
    costClass: 'cheap',
  },

  defaultMotion: buttonMotion,

  codegen: {
    tag: 'button',
    client: {
      kind: 'never',
      reason:
        'Markup and CSS at every prop set: no hook, no handler, and the busy state is two attributes.',
    },
    notes: [
      'While loading this carries aria-busy and aria-disabled and stops responding to the pointer. Activation by keyboard is not blocked here — a static component has nothing to block it with — so the click or submit handler you add has to check aria-disabled before it acts.',
    ],
  },

  a11y: {
    notes: [
      'An href renders an anchor and no href renders a button, because Enter and Space are not interchangeable and the element is what tells a reader which one applies.',
      'Icons are aria-hidden: the label is the accessible name, and a labelled glyph beside it would announce twice.',
      'The busy state is aria-busy plus a visually hidden word beside the label, so it is announced without a live region — which a static export has nowhere to put.',
      'aria-disabled rather than disabled while busy: a disabled control leaves the focus order, so a keyboard user would never reach it to hear that it is busy.',
      'The focus ring is the category ring at a 2 px offset, drawn on the control rather than inherited, so the export keeps it.',
    ],
  },
})
