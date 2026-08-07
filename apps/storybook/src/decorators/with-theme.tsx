import { PRESETS, ThemeScope } from '@motion-studio/theme'
import type { Decorator } from '@storybook/react'

import { type ToolbarGlobals, readGlobal } from './globals'
import { selectedColorMode } from './with-color-mode'

import type { PresetId, ThemeConfig } from '@motion-studio/theme'

const PRESET_IDS = Object.keys(PRESETS) as readonly PresetId[]

export const themeGlobal: ToolbarGlobals = {
  theme: {
    name: 'Theme',
    description: 'One of the ten presets in THEME_ENGINE.md § Presets',
    defaultValue: 'studio-dark',
    toolbar: {
      icon: 'paintbrush',
      dynamicTitle: true,
      items: PRESET_IDS.map((id) => ({ value: id, title: PRESETS[id].name })),
    },
  },
}

/**
 * `ThemeScope`, never a root write — prompt 10 § Constraints. The variables land on the story's own
 * wrapper, so switching a theme repaints the story and leaves Storybook's chrome and the docs page
 * exactly as they were.
 *
 * The colour mode arrives here rather than in a wrapper of its own because `THEME_ENGINE.md` makes it a
 * field of `ThemeConfig`: the mode selects a different set of variable *values*, not a different layer.
 */
export const withTheme: Decorator = (Story, context) => {
  const preset = PRESETS[readGlobal(context.globals['theme'], PRESET_IDS, 'studio-dark')]
  const selection = selectedColorMode(context.globals)
  const theme: ThemeConfig = selection === 'preset' ? preset : { ...preset, colorMode: selection }

  return (
    <ThemeScope theme={theme} className="ms-story-scope">
      <Story />
    </ThemeScope>
  )
}
