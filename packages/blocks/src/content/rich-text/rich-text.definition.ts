import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import { ALIGNMENTS, optionsFrom } from '../../scales'

import { richTextMotion } from './rich-text.motion'
import { RICH_TEXT_SIZES, richTextSchema } from './rich-text.schema'

export const richTextDefinition = defineBlock({
  id: blockId('rich-text'),
  name: 'Rich text',
  description: 'Prose with a restricted set of formatting, stored as a tree rather than as markup.',
  category: 'content',
  tags: ['rich text', 'prose', 'formatting', 'list'],
  icon: 'list',

  propsSchema: richTextSchema,
  defaults: richTextSchema.parse({}),
  previewProps: richTextSchema.parse({ size: 'lg' }),

  slots: [],

  controls: [
    {
      id: 'content',
      label: 'Content',
      controls: [
        {
          path: 'content',
          kind: 'richText',
          label: 'Content',
          hint: 'Bold, italic, inline code, links and lists. A paste keeps its text and loses the rest',
        },
      ],
    },
    {
      id: 'typography',
      label: 'Typography',
      controls: [
        {
          path: 'size',
          kind: 'segmented',
          label: 'Size',
          responsive: true,
          options: { options: optionsFrom(RICH_TEXT_SIZES) },
        },
        {
          path: 'measure',
          kind: 'select',
          label: 'Measure',
          responsive: true,
          options: { options: optionsFrom(['narrow', 'default', 'wide', 'full']) },
        },
        {
          path: 'align',
          kind: 'segmented',
          label: 'Align',
          responsive: true,
          options: { options: optionsFrom(ALIGNMENTS) },
        },
        { path: 'hidden', kind: 'switch', label: 'Hidden', responsive: true },
      ],
    },
  ],

  capabilities: {
    resizable: false,
    fullWidth: false,
    requiresBackdrop: false,
    supportsMotion: ['entrance', 'scroll'],
    costClass: 'cheap',
  },

  defaultMotion: richTextMotion,

  codegen: {
    tag: 'div',
    client: {
      kind: 'never',
      reason:
        'Each block it renders is an element chosen by prop, and none of them carries behaviour.',
    },
  },

  a11y: {
    notes: [
      'The value is a tree, not markup, so the component renders React elements and never innerHTML — the five elements it can produce are the only five that exist.',
      'Lists are real ul/ol/li, so a screen reader announces the count and the position rather than reading bullet characters.',
      'A link whose scheme fails the allowlist keeps its text and loses its href: the words were content, the scheme was the payload.',
      'Inline code is a code element, so it is announced as code rather than as differently-shaped prose.',
    ],
  },
})
