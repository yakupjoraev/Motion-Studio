import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import { SPACE_SCALE, optionsFrom } from '../../scales'

import { dividerMotion } from './divider.motion'
import {
  DIVIDER_LABEL_MAX,
  DIVIDER_ORIENTATIONS,
  DIVIDER_STYLES,
  dividerSchema,
} from './divider.schema'

export const dividerDefinition = defineBlock({
  id: blockId('divider'),
  name: 'Divider',
  description: 'A rule between sections, with an optional label in the middle.',
  category: 'layout',
  tags: ['layout', 'rule', 'separator'],
  icon: 'minus',

  propsSchema: dividerSchema,
  defaults: dividerSchema.parse({}),
  previewProps: dividerSchema.parse({ label: 'or', fade: true }),

  slots: [],

  controls: [
    {
      id: 'layout',
      label: 'Layout',
      controls: [
        {
          path: 'orientation',
          kind: 'segmented',
          label: 'Orientation',
          responsive: true,
          options: { options: optionsFrom(DIVIDER_ORIENTATIONS) },
        },
        {
          path: 'spacing',
          kind: 'select',
          label: 'Spacing',
          responsive: true,
          options: { options: optionsFrom(SPACE_SCALE) },
        },
        { path: 'hidden', kind: 'switch', label: 'Hidden', responsive: true },
      ],
    },
    {
      id: 'style',
      label: 'Style',
      controls: [
        {
          path: 'lineStyle',
          kind: 'segmented',
          label: 'Line',
          options: { options: optionsFrom(DIVIDER_STYLES) },
        },
        { path: 'fade', kind: 'switch', label: 'Fade', hint: 'Fades out at both ends' },
      ],
    },
    {
      id: 'content',
      label: 'Content',
      controls: [
        {
          path: 'label',
          kind: 'text',
          label: 'Label',
          hint: 'A label turns the rule into line-text-line',
          options: { maxLength: DIVIDER_LABEL_MAX },
        },
      ],
    },
  ],

  capabilities: {
    resizable: false,
    fullWidth: true,
    requiresBackdrop: false,
    supportsMotion: ['entrance'],
    costClass: 'cheap',
  },

  defaultMotion: dividerMotion,

  codegen: { tag: 'hr' },

  a11y: {
    notes: [
      'Unlabelled it is an <hr>, which is already a separator and needs no role.',
      'Labelled it is a div with role="separator" and an accessible name, because an <hr> cannot hold text.',
      'The two rules beside a label are aria-hidden: the name carries the meaning, the lines are decoration.',
    ],
  },
})
