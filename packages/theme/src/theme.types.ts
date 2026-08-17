import type { ColorMode, ElevationStyle, SemanticColorToken } from '@motion-studio/tokens'

/**
 * `THEME_ENGINE.md` § ThemeConfig, transcribed. This is the entire user-facing surface of theming —
 * everything else is derived. Nothing outside `resolveTheme` and the theme builder reads it: a
 * component uses token classes, never the config (§ Rules, 1).
 */

/** The six neutral families a theme can pick. Hue angles are in `resolve/neutral.ts` — ADR-022. */
export type NeutralHue = 'slate' | 'zinc' | 'stone' | 'gray' | 'warm' | 'cool'

/** `docs/DESIGN_SYSTEM.md` § Families ships `geist`; the rest are the additional pairings — ADR-024. */
export type FontPairingId = 'geist' | 'inter-mono' | 'satoshi-jet' | 'sohne-berkeley' | 'system'

export type RadiusScale = 0 | 0.5 | 1 | 1.5 | 2
export type SpacingScale = 0.875 | 1 | 1.125
export type MotionScale = 0 | 0.5 | 1 | 1.5
export type BaseSize = 14 | 15 | 16
export type ScaleRatio = 1.2 | 1.25 | 1.333
export type GlassLevel = 'none' | 'subtle' | 'medium' | 'strong'
export type NoiseLevel = 'none' | 'subtle' | 'light' | 'medium'
export type BorderStyle = 'hairline' | 'solid' | 'none'
export type ColorModePreference = ColorMode | 'system'

export interface ThemePalette {
  /** OKLCH or hex; the seed. Its own lightness picks which step becomes `accent`. */
  readonly accent: string
  readonly neutral: NeutralHue
  /** −30..30, shifts the generated ramp's hue toward each end. */
  readonly accentHueShift: number
  /** 0.5..1.5, chroma multiplier. */
  readonly saturation: number
  /**
   * `false` is the theme builder's "keep mine": the accent stays where the seed put it and the
   * failing pair is reported as an override instead of being repaired — ADR-170.
   */
  readonly repairContrast: boolean
}

export interface ThemeTypography {
  readonly pairing: FontPairingId
  readonly baseSize: BaseSize
  readonly scaleRatio: ScaleRatio
}

export interface ThemeSurface {
  readonly glassLevel: GlassLevel
  readonly noiseLevel: NoiseLevel
  readonly borderStyle: BorderStyle
}

export interface ThemeConfig {
  readonly id: string
  readonly name: string
  readonly colorMode: ColorModePreference
  readonly palette: ThemePalette
  readonly radiusScale: RadiusScale
  readonly spacingScale: SpacingScale
  readonly motionScale: MotionScale
  readonly elevationStyle: ElevationStyle
  readonly typography: ThemeTypography
  readonly surface: ThemeSurface
}

/**
 * One substitution made by contrast repair. Reported, never silent: `THEME_ENGINE.md` § Contrast
 * repair — "We never silently ship failing contrast, and we never silently override the user either."
 */
export interface ContrastRepair {
  readonly token: SemanticColorToken
  readonly against: SemanticColorToken
  /** The threshold the pair had to clear, 4.5 or 3. */
  readonly required: number
  readonly measured: number
  readonly from: string
  readonly to: string
  /** The ramp step the substitute came from, so the report can name it. */
  readonly step: number
  readonly repaired: number
  /** Ready for the theme builder's warning chip. */
  readonly message: string
}

export interface ThemeResolution {
  readonly config: ThemeConfig
  /** The mode actually in force: `system` has already been resolved against the environment. */
  readonly mode: ColorMode
  readonly variables: Readonly<Record<string, string>>
  /** Substitutions the engine made. */
  readonly repairs: readonly ContrastRepair[]
  /**
   * Substitutions the engine found and did not make, because `palette.repairContrast` is `false`.
   * The variables carry the user's accent; this carries what it measured — ADR-170.
   */
  readonly overrides: readonly ContrastRepair[]
  readonly warnings: readonly string[]
}
