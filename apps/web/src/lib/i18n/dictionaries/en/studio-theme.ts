import type { PluralForms } from '../../plural'

/** The theme builder: its six sections, its contrast report and the token export beside it. */
export const studioTheme = {
  mode: 'Mode',
  preset: 'Preset',
  palette: 'Palette',
  scales: 'Scales',
  typography: 'Typography',
  surface: 'Surface',
  reset: 'Reset',
  resetDisabled: 'This theme is not based on a preset',
  saveAsPreset: 'Save as preset',
  presetName: 'Preset name',
  rename: 'Rename',
  delete: 'Delete',
  saved: 'Saved',

  light: 'Light',
  lightMode: 'Light mode',
  dark: 'Dark',
  darkMode: 'Dark mode',
  system: 'System',
  followSystem: 'Follow the system',

  accent: 'Accent',
  neutral: 'Neutral',
  hueShift: 'Hue shift',
  saturation: 'Saturation',

  radius: 'Radius',
  spacing: 'Spacing',
  motion: 'Motion',
  elevation: 'Elevation',
  flat: 'Flat',
  soft: 'Soft',
  sharp: 'Sharp',
  glow: 'Glow',

  fontPairing: 'Font pairing',
  baseSize: 'Base size',
  scaleRatio: 'Scale ratio',

  glass: 'Glass',
  noise: 'Noise',
  borders: 'Borders',
  none: 'None',
  subtle: 'Subtle',
  /** The noise scale's third step — `light` as in faint, not as in the light colour mode. */
  lightLevel: 'Light',
  medium: 'Medium',
  strong: 'Strong',
  hairline: 'Hairline',
  solid: 'Solid',
  noGlass: 'No glass',
  subtleGlass: 'Subtle glass',
  mediumGlass: 'Medium glass',
  strongGlass: 'Strong glass',
  noNoise: 'No noise',
  subtleNoise: 'Subtle noise',
  lightNoise: 'Light noise',
  mediumNoise: 'Medium noise',
  hairlineBorders: 'Hairline borders',
  solidBorders: 'Solid borders',
  noBorders: 'No borders',

  contrast: 'Contrast',
  contrastPasses: 'Contrast passes in this mode.',
  contrastPassesShort: 'Contrast passes.',
  /** `{count}` pairs the engine repaired on its own. */
  contrastRepairs: {
    one: '{count} contrast repair',
    other: '{count} contrast repairs',
  } as PluralForms,
  /** `{count}` pairs the author chose to keep as they were. */
  contrastKept: '{count} kept at your request',
  /** `{count}` pairs no accent step can fix. */
  contrastUnfixable: {
    one: '{count} pair no step can fix',
    other: '{count} pairs no step can fix',
  } as PluralForms,
  /** `{token}` on `{against}` measured `{measured}` against a required `{required}`. */
  contrastMeasured: '{token} on {against} was {measured} (needs {required}:1)',
  /** `{step}` is the accent step, `{ratio}` what it would measure. */
  contrastKeepingYours: 'Keeping yours. Accent step {step} would measure {ratio}.',
  contrastUsingStep: 'Using accent step {step} instead, which measures {ratio}.',
  repairIt: 'Repair it',
  keepMine: 'Keep mine',
  details: 'Details',
  yours: 'Yours',
  repaired: 'Repaired',
  measured: 'Measured',
  required: 'Required',

  exportTokens: 'Export tokens',
  exportTokensDescription: 'Four formats, generated from the same resolved theme.',
  tokenFormats: 'Token formats',
  copy: 'Copy',
  copied: 'Copied',
  download: 'Download',
}
