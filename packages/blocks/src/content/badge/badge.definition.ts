import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import { optionsFrom } from '../../scales'

import { badgeMotion } from './badge.motion'
import { BADGE_MAX_LENGTH, BADGE_SIZES, BADGE_VARIANTS, badgeSchema } from './badge.schema'

export const badgeDefinition = defineBlock({
  id: blockId('badge'),
  name: 'Badge',
  description: 'A pill for a status or a short label.',
  category: 'content',
  tags: ['badge', 'pill', 'status', 'label'],
  icon: 'card',

  propsSchema: badgeSchema,
  defaults: badgeSchema.parse({}),
  previewProps: badgeSchema.parse({ label: 'Shipping', variant: 'success', dot: true }),

  slots: [],

  controls: [
    {
      id: 'content',
      label: 'Content',
      controls: [
        {
          path: 'label',
          kind: 'text',
          label: 'Label',
          options: { maxLength: BADGE_MAX_LENGTH },
        },
        { path: 'icon', kind: 'icon', label: 'Icon' },
        { path: 'dot', kind: 'switch', label: 'Status dot' },
      ],
    },
    {
      id: 'style',
      label: 'Style',
      controls: [
        {
          path: 'variant',
          kind: 'select',
          label: 'Variant',
          options: { options: optionsFrom(BADGE_VARIANTS) },
        },
        {
          path: 'size',
          kind: 'segmented',
          label: 'Size',
          options: { options: optionsFrom(BADGE_SIZES) },
        },
        { path: 'hidden', kind: 'switch', label: 'Hidden', responsive: true },
      ],
    },
  ],

  capabilities: {
    resizable: false,
    fullWidth: false,
    requiresBackdrop: false,
    supportsMotion: ['entrance', 'hover'],
    costClass: 'cheap',
  },

  defaultMotion: badgeMotion,

  codegen: { tag: 'span' },

  a11y: {
    notes: [
      'The label is the meaning. The dot and the icon are decorative and aria-hidden, so a status is never conveyed by colour or by a shape alone.',
      'The icon is resolved from the registry by name; a name the registry does not know renders nothing rather than throwing on somebody else’s document.',
    ],
  },
})
