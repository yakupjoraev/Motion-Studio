import { NEUTRAL, VIOLET } from '@motion-studio/tokens'
import { formatHex, parseOklch } from '@motion-studio/utils'
import { create } from '@storybook/theming'

/**
 * Storybook's own chrome, built from the same primitives the product uses. It is a separate surface
 * from the story canvas on purpose — prompt 10 § Constraints: switching a theme in the toolbar must
 * not repaint the tool around it — so this reads the primitive ramps directly rather than the runtime
 * variables, which only exist inside a `ThemeScope`.
 *
 * Every value is converted to hex on the way in. `@storybook/theming` runs these through `polished`,
 * whose parser predates `oklch()` and throws "Couldn't parse the color string" on one — which renders
 * as a failed docs page rather than as a warning. `formatHex` clamps chroma into sRGB first, so the
 * chrome is the nearest in-gamut colour to the token rather than three clipped channels.
 */
const hex = (color: string): string => formatHex(parseOklch(color))

export const storybookTheme = create({
  base: 'dark',
  brandTitle: 'Motion Studio',
  brandTarget: '_self',

  colorPrimary: hex(VIOLET[500]),
  colorSecondary: hex(VIOLET[400]),

  appBg: hex(NEUTRAL[1000]),
  appContentBg: hex(NEUTRAL[950]),
  appPreviewBg: hex(NEUTRAL[950]),
  appBorderColor: hex(NEUTRAL[800]),
  appBorderRadius: 6,

  textColor: hex(NEUTRAL[100]),
  textInverseColor: hex(NEUTRAL[950]),
  textMutedColor: hex(NEUTRAL[400]),

  barTextColor: hex(NEUTRAL[400]),
  barSelectedColor: hex(NEUTRAL[50]),
  barHoverColor: hex(VIOLET[400]),
  barBg: hex(NEUTRAL[1000]),

  inputBg: hex(NEUTRAL[900]),
  inputBorder: hex(NEUTRAL[800]),
  inputTextColor: hex(NEUTRAL[100]),
  inputBorderRadius: 4,

  fontBase: "'Geist Sans', system-ui, sans-serif",
  fontCode: "'Geist Mono', ui-monospace, monospace",
})
