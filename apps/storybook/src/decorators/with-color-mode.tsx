import type { Decorator } from '@storybook/react'

import { type ToolbarGlobals, readGlobal } from './globals'

import type { ColorMode } from '@motion-studio/theme'

/** `preset` leaves the theme's own `colorMode` alone; the other two override it. */
export type ColorModeSelection = 'preset' | ColorMode

const SELECTIONS: readonly ColorModeSelection[] = ['preset', 'light', 'dark']

export const colorModeGlobal: ToolbarGlobals = {
  colorMode: {
    name: 'Colour mode',
    description: 'Light or dark, or whatever the theme preset declares',
    defaultValue: 'preset',
    toolbar: {
      icon: 'contrast',
      dynamicTitle: true,
      items: [
        { value: 'preset', title: 'Preset default' },
        { value: 'light', title: 'Light', icon: 'sun' },
        { value: 'dark', title: 'Dark', icon: 'moon' },
      ],
    },
  },
}

export function selectedColorMode(globals: Record<string, unknown>): ColorModeSelection {
  return readGlobal(globals['colorMode'], SELECTIONS, 'preset')
}

/**
 * The canvas outside the theme scope — Storybook's own padding — follows the mode too, so a dark story
 * does not sit in a white frame. The variables themselves are `withTheme`'s job; this writes only the
 * attribute the generated stylesheet and `color-scheme` select on.
 */
export const withColorMode: Decorator = (Story, context) => {
  const selection = selectedColorMode(context.globals)

  return (
    <div
      data-color-mode={selection === 'preset' ? undefined : selection}
      style={{ colorScheme: selection === 'preset' ? undefined : selection }}
    >
      <Story />
    </div>
  )
}
