export {
  applyTheme,
  applyThemePartial,
  environmentMode,
  markThemeReady,
  type ApplyOptions,
} from './apply/apply-theme'
export { ThemeScope, type ThemeScopeProps } from './apply/theme-scope'
export {
  TOKEN_FORMATS,
  exportedAccent,
  overrideNotes,
  resolveForExport,
  toCssVariables,
  toFigmaTokens,
  toTailwindConfig,
  toTokensJson,
  warningNotes,
  type ThemeExport,
  type TokenFormat,
  type TokenFormatId,
} from './export/index'
export { setColorMode, type SetColorModeOptions } from './apply/set-color-mode'
export {
  colorModeSubscriberCount,
  resetColorModeSubscription,
  useColorMode,
} from './apply/use-color-mode'
export {
  PRESETS,
  aurora,
  brutal,
  candy,
  ember,
  midnight,
  mono,
  nord,
  paper,
  studioDark,
  studioLight,
  type PresetId,
} from './presets/index'
export {
  accentStepFor,
  generateRamp,
  seedSaturation,
  type RampOptions,
} from './resolve/generate-ramp'
export { NEUTRAL_FAMILY, NEUTRAL_HUES, type NeutralFamily } from './resolve/neutral'
export { repairContrast, type RepairResult } from './resolve/repair-contrast'
export {
  CACHE_LIMIT,
  clearThemeCache,
  resolveTheme,
  type ResolveOptions,
} from './resolve/resolve-theme'
export { FONT_PAIRING, scaleTypeScale, type ScaledType } from './resolve/typography'
export {
  COLOR_MODE_SCRIPT,
  COLOR_MODE_STORAGE_KEY,
  clearColorMode,
  storeColorMode,
  storedColorMode,
} from './script/color-mode-script'
export {
  colorModePreferenceSchema,
  colorModeSchema,
  elevationStyleSchema,
  fontPairingSchema,
  neutralHueSchema,
  themeConfigSchema,
  themePaletteSchema,
  themeSurfaceSchema,
  themeTypographySchema,
  type ThemeConfigInput,
} from './theme.schema'
// Re-exported because `ThemeResolution.mode` is one: a consumer of this package should not have to
// depend on `tokens` to name the type this package hands it.
export type { ColorMode } from '@motion-studio/tokens'
export type {
  BaseSize,
  BorderStyle,
  ColorModePreference,
  ContrastRepair,
  FontPairingId,
  GlassLevel,
  MotionScale,
  NeutralHue,
  NoiseLevel,
  RadiusScale,
  ScaleRatio,
  SpacingScale,
  ThemeConfig,
  ThemePalette,
  ThemeResolution,
  ThemeSurface,
  ThemeTypography,
} from './theme.types'
