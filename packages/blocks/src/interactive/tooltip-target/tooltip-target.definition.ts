import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import { optionsFrom } from '../../scales'
import { INTERACTIVE_FRAME_CONTROLS, SIZE_CONTROL, VARIANT_CONTROL } from '../interactive.controls'
import { BODY_MAX_LENGTH, ICON_NAME_MAX_LENGTH, LABEL_MAX_LENGTH } from '../interactive.schema'

import { tooltipTargetMotion } from './tooltip-target.motion'
import {
  MAX_TOOLTIP_DELAY,
  MIN_TOOLTIP_DELAY,
  TOOLTIP_DELAY_STEP,
  TOOLTIP_SIDES,
  tooltipTargetSchema,
} from './tooltip-target.schema'

export const tooltipTargetDefinition = defineBlock({
  id: blockId('tooltip-target'),
  name: 'Tooltip',
  description: 'A control with a description that appears on hover and on focus.',
  category: 'interactive',
  tags: ['tooltip', 'hint', 'description', 'hover'],
  icon: 'info',

  propsSchema: tooltipTargetSchema,
  defaults: tooltipTargetSchema.parse({}),
  previewProps: tooltipTargetSchema.parse({ icon: 'info' }),

  slots: [],

  controls: [
    {
      id: 'content',
      label: 'Content',
      controls: [
        { path: 'label', kind: 'text', label: 'Label', options: { maxLength: LABEL_MAX_LENGTH } },
        {
          path: 'icon',
          kind: 'icon',
          label: 'Icon',
          options: { maxLength: ICON_NAME_MAX_LENGTH },
        },
        {
          path: 'content',
          kind: 'textarea',
          label: 'Tooltip',
          hint: 'Read out as the control’s description, whether or not the bubble is showing',
          options: { rows: 2, maxLength: BODY_MAX_LENGTH },
        },
      ],
    },
    {
      id: 'style',
      label: 'Style',
      controls: [
        VARIANT_CONTROL,
        SIZE_CONTROL,
        {
          path: 'side',
          kind: 'segmented',
          label: 'Side',
          options: { options: optionsFrom(TOOLTIP_SIDES) },
        },
        {
          path: 'delay',
          kind: 'slider',
          label: 'Hover delay',
          hint: 'Focus never waits: a delay there reads as a dropped key',
          options: {
            min: MIN_TOOLTIP_DELAY,
            max: MAX_TOOLTIP_DELAY,
            step: TOOLTIP_DELAY_STEP,
            unit: 'ms',
          },
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

  defaultMotion: tooltipTargetMotion,

  codegen: {
    tag: 'span',
    client: {
      kind: 'always',
      reason:
        'The open state, the hover delay and the Escape listener are all state and effects — and no dependency, because a block cannot install a tooltip provider.',
    },
    notes: [
      'The bubble is positioned by CSS against the control, with no collision detection: near a viewport edge choose the side that has room, which is what the side prop is for.',
    ],
  },

  a11y: {
    notes: [
      'The description is on the button itself through aria-describedby, because that attribute is only read on the element that takes focus — a wrapper around a child could not carry it (ADR-202).',
      'The bubble is always in the DOM and always the description target: one that mounted on hover would be a description a screen-reader user never receives.',
      'It appears on focus as well as on hover, so nothing is disclosed by pointer alone, and focus opens it immediately while the pointer waits out the delay.',
      'Escape closes it without moving the pointer, the bubble is hoverable, and nothing hides it on a timer — the three conditions WCAG 1.4.13 sets.',
      'The glyph is aria-hidden; the label is the control’s accessible name and the tooltip is its description, which are two different things.',
    ],
  },
})
