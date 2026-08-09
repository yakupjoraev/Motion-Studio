import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import { optionsFrom } from '../../scales'

import { LANGUAGES } from './code-block.languages'
import { codeBlockMotion } from './code-block.motion'
import { CODE_MAX_LENGTH, FILENAME_MAX_LENGTH, codeBlockSchema } from './code-block.schema'

export const codeBlockDefinition = defineBlock({
  id: blockId('code-block'),
  name: 'Code block',
  description: 'A highlighted code sample with line numbers and a copy button.',
  category: 'content',
  tags: ['code', 'snippet', 'developer', 'syntax'],
  icon: 'code',

  propsSchema: codeBlockSchema,
  defaults: codeBlockSchema.parse({}),
  previewProps: codeBlockSchema.parse({ highlightLines: '4' }),

  slots: [],

  controls: [
    {
      id: 'content',
      label: 'Content',
      controls: [
        {
          path: 'code',
          kind: 'textarea',
          label: 'Code',
          options: { maxLength: CODE_MAX_LENGTH, rows: 10, monospace: true },
        },
        {
          path: 'language',
          kind: 'select',
          label: 'Language',
          options: { options: optionsFrom(LANGUAGES) },
        },
        {
          path: 'filename',
          kind: 'text',
          label: 'Filename',
          options: { maxLength: FILENAME_MAX_LENGTH },
        },
      ],
    },
    {
      id: 'style',
      label: 'Style',
      controls: [
        { path: 'showLineNumbers', kind: 'switch', label: 'Line numbers' },
        {
          path: 'highlightLines',
          kind: 'text',
          label: 'Highlight lines',
          hint: 'A range like 2-4,7. Anything unparseable highlights nothing',
          options: { maxLength: 120 },
        },
        { path: 'showCopyButton', kind: 'switch', label: 'Copy button' },
        {
          path: 'wrap',
          kind: 'switch',
          label: 'Wrap lines',
          hint: 'Off keeps the sample scrollable, which is what a keyboard can reach',
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
    costClass: 'moderate',
    minWidth: 200,
  },

  defaultMotion: codeBlockMotion,

  codegen: { tag: 'pre' },

  a11y: {
    notes: [
      'The scroller is focusable and carries a role and a label, so a sample wider than its column is reachable from the keyboard instead of being content nobody can scroll.',
      'Line numbers are aria-hidden and never part of what a user copies — the copy button copies the code prop, not the rendered text.',
      'The copy confirmation is announced through a polite live region as well as being visible on the button.',
      'A highlighted line carries an inset rule as well as a tint, so the emphasis survives greyscale.',
    ],
  },
})
