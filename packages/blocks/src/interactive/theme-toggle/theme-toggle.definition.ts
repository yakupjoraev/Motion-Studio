import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import { optionsFrom } from '../../scales'
import { LABELLED_FRAME_CONTROLS, SIZE_CONTROL } from '../interactive.controls'
import { LABEL_MAX_LENGTH } from '../interactive.schema'

import { COLOR_MODE_MODULE } from './theme-toggle.codegen'
import { themeToggleMotion } from './theme-toggle.motion'
import { TOGGLE_VARIANTS, themeToggleSchema } from './theme-toggle.schema'

export const themeToggleDefinition = defineBlock({
  id: blockId('theme-toggle'),
  name: 'Theme toggle',
  description: 'Light, dark, or whatever the system says — and it works in the export.',
  category: 'interactive',
  tags: ['theme', 'colour mode', 'dark mode', 'toggle', 'switch'],
  icon: 'sun',

  propsSchema: themeToggleSchema,
  defaults: themeToggleSchema.parse({}),
  previewProps: themeToggleSchema.parse({}),

  slots: [],

  controls: [
    {
      id: 'style',
      label: 'Style',
      controls: [
        {
          path: 'variant',
          kind: 'segmented',
          label: 'Variant',
          hint: 'Icons keeps each label as its accessible name',
          options: { options: optionsFrom(TOGGLE_VARIANTS) },
        },
        SIZE_CONTROL,
        ...LABELLED_FRAME_CONTROLS,
      ],
    },
    {
      id: 'choices',
      label: 'Choices',
      controls: [
        {
          path: 'includeSystem',
          kind: 'switch',
          label: 'Offer System',
          hint: 'Without it a reader cannot go back to following their operating system',
        },
        {
          path: 'lightLabel',
          kind: 'text',
          label: 'Light label',
          options: { maxLength: LABEL_MAX_LENGTH },
        },
        {
          path: 'darkLabel',
          kind: 'text',
          label: 'Dark label',
          options: { maxLength: LABEL_MAX_LENGTH },
        },
        {
          path: 'systemLabel',
          kind: 'text',
          label: 'System label',
          options: { maxLength: LABEL_MAX_LENGTH },
        },
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

  defaultMotion: themeToggleMotion,

  codegen: {
    tag: 'div',
    /*
     * No dependency, by requirement: the exported toggle has to work in a project that has never heard of this
     * repository, so the twelve statements it needs travel as a local module — ADR-201.
     */
    imports: [{ from: '../lib/color-mode', named: ['setColorMode', 'storedColorMode'] }],
    runtimeModule: COLOR_MODE_MODULE,
    client: {
      kind: 'always',
      reason: 'It holds the chosen mode and reads localStorage in an effect after mount.',
    },
    notes: [
      'The emitted lib/color-mode.ts also exports COLOR_MODE_SCRIPT. Put it in <head> as a blocking inline script, or every reload paints the wrong theme before this component mounts.',
      'The mode is applied as data-color-mode on <html>, which is the attribute the generated stylesheet selects on. If you are not exporting the theme’s CSS variables, style against that attribute yourself.',
    ],
  },

  a11y: {
    notes: [
      'A labelled group of three individually tabbable buttons, each carrying aria-pressed — a toggle-button group, which is what this is, rather than a radio group whose arrow keys would have to check what they move to.',
      'The pressed choice is a raised surface and a heavier weight as well as a colour, so the state does not rest on hue.',
      'In the icons variant every button keeps its word as a visually hidden label, so the accessible name says "Dark" rather than nothing.',
      'The stored preference is read after mount, so the server-rendered markup and the first client render agree — the theme itself is already correct, because the blocking head script set the attribute before paint.',
      'Choosing System removes the stored preference rather than storing a third value, which is what lets the page follow the operating system again.',
    ],
  },
})
