import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import { SURFACE_TOKENS, optionsFrom } from '../../scales'
import { HERO_COPY_CONTROLS, HERO_FRAME_CONTROLS } from '../hero.controls'

import { heroTerminalMotion } from './hero-terminal.motion'
import {
  LINE_KINDS,
  LINE_MAX_LENGTH,
  MAX_LINES,
  WINDOW_CHROME,
  heroTerminalSchema,
} from './hero-terminal.schema'

export const heroTerminalDefinition = defineBlock({
  id: blockId('hero-terminal'),
  name: 'Hero — terminal',
  description: 'Text beside a terminal window that types its transcript.',
  category: 'hero',
  tags: ['hero', 'landing', 'terminal', 'developer'],
  icon: 'code',

  propsSchema: heroTerminalSchema,
  defaults: heroTerminalSchema.parse({}),
  previewProps: heroTerminalSchema.parse({ minHeight: 'auto', padding: 'lg' }),

  slots: [],

  controls: [
    { id: 'content', label: 'Content', controls: HERO_COPY_CONTROLS },
    { id: 'layout', label: 'Layout', controls: HERO_FRAME_CONTROLS },
    {
      id: 'terminal',
      label: 'Terminal',
      controls: [
        { path: 'title', kind: 'text', label: 'Window title', options: { maxLength: 48 } },
        {
          path: 'chrome',
          kind: 'segmented',
          label: 'Window chrome',
          options: { options: optionsFrom(WINDOW_CHROME) },
        },
        { path: 'caret', kind: 'switch', label: 'Caret' },
        {
          path: 'lines',
          kind: 'list',
          label: 'Lines',
          options: {
            max: MAX_LINES,
            labelKey: 'text',
            itemTemplate: { text: '', kind: 'output' },
            itemControls: [
              {
                path: 'text',
                kind: 'text',
                label: 'Text',
                options: { maxLength: LINE_MAX_LENGTH },
              },
              {
                path: 'kind',
                kind: 'segmented',
                label: 'Kind',
                options: { options: optionsFrom(LINE_KINDS) },
              },
            ],
          },
        },
      ],
    },
    {
      id: 'style',
      label: 'Style',
      controls: [
        {
          path: 'background',
          kind: 'select',
          label: 'Background',
          options: { options: optionsFrom(SURFACE_TOKENS) },
        },
      ],
    },
  ],

  capabilities: {
    resizable: false,
    fullWidth: true,
    requiresBackdrop: false,
    supportsMotion: ['entrance', 'scroll', 'continuous'],
    costClass: 'cheap',
  },

  defaultMotion: heroTerminalMotion,

  codegen: { tag: 'section' },

  a11y: {
    notes: [
      'Every line is real text in a <pre><code> before any animation runs, so the transcript is readable with motion disabled and legible to a screen reader in one pass.',
      'The line sigils ($, !) come from the line kind rather than from the text, so what a user copies is the command and not the prompt.',
      'The traffic lights and the caret are aria-hidden: they are furniture, and reading “circle circle circle” to somebody is not a window.',
      'Colour is not the only difference between an output line and an error line — the sigil differs too.',
    ],
  },
})
