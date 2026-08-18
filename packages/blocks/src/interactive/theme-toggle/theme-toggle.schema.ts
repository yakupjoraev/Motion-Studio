import { z } from 'zod'

import { LABEL_MAX_LENGTH, controlSize, labelledFrameFields } from '../interactive.schema'

/** The three states `THEME_ENGINE.md` § Colour mode defines, in the order a switch shows them. */
export const COLOR_MODE_CHOICES = ['light', 'dark', 'system'] as const

export type ColorModeChoice = (typeof COLOR_MODE_CHOICES)[number]

export const TOGGLE_VARIANTS = ['segmented', 'icons'] as const

export type ToggleVariant = (typeof TOGGLE_VARIANTS)[number]

/** The glyph per choice. `monitor` is what "whatever the system says" looks like beside two weather symbols. */
export const CHOICE_ICONS: Readonly<Record<ColorModeChoice, string>> = {
  light: 'sun',
  dark: 'moon',
  system: 'monitor',
}

export const themeToggleSchema = z.object({
  variant: z.enum(TOGGLE_VARIANTS).default('segmented'),
  size: controlSize.default('sm'),
  /**
   * Whether the third choice is offered. Without it the reader cannot get back to following their operating
   * system once they have chosen — which is why it is on by default.
   */
  includeSystem: z.boolean().default(true),
  lightLabel: z.string().min(1).max(LABEL_MAX_LENGTH).default('Light'),
  darkLabel: z.string().min(1).max(LABEL_MAX_LENGTH).default('Dark'),
  systemLabel: z.string().min(1).max(LABEL_MAX_LENGTH).default('System'),
  ...labelledFrameFields('Colour mode'),
})

export type ThemeToggleProps = z.infer<typeof themeToggleSchema>

export const visibleChoices = (includeSystem: boolean): readonly ColorModeChoice[] =>
  includeSystem ? COLOR_MODE_CHOICES : ['light', 'dark']
