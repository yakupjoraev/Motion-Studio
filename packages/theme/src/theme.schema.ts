import { z } from 'zod'

/**
 * The `ThemeConfig` schema. `FILE_FORMAT.md` reads it later: a `.motion` document carries its theme, so
 * an imported file has to be validated rather than trusted.
 *
 * Every enum here is the same closed set as the corresponding type in `theme.types.ts`. They are declared
 * twice on purpose — `theme.schema.test.ts` asserts a value satisfying the schema also satisfies the type
 * and the reverse, so the pair cannot drift while both remain readable on their own.
 */
export const neutralHueSchema = z.enum(['slate', 'zinc', 'stone', 'gray', 'warm', 'cool'])

export const fontPairingSchema = z.enum([
  'geist',
  'inter-mono',
  'satoshi-jet',
  'sohne-berkeley',
  'system',
])

export const colorModeSchema = z.enum(['light', 'dark'])
export const colorModePreferenceSchema = z.enum(['light', 'dark', 'system'])
export const elevationStyleSchema = z.enum(['flat', 'soft', 'sharp', 'glow'])

export const themePaletteSchema = z.object({
  accent: z.string().min(1),
  neutral: neutralHueSchema,
  accentHueShift: z.number().min(-30).max(30),
  saturation: z.number().min(0.5).max(1.5),
})

export const themeTypographySchema = z.object({
  pairing: fontPairingSchema,
  baseSize: z.union([z.literal(14), z.literal(15), z.literal(16)]),
  scaleRatio: z.union([z.literal(1.2), z.literal(1.25), z.literal(1.333)]),
})

export const themeSurfaceSchema = z.object({
  glassLevel: z.enum(['none', 'subtle', 'medium', 'strong']),
  noiseLevel: z.enum(['none', 'subtle', 'light', 'medium']),
  borderStyle: z.enum(['hairline', 'solid', 'none']),
})

export const themeConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  colorMode: colorModePreferenceSchema,
  palette: themePaletteSchema,
  radiusScale: z.union([z.literal(0), z.literal(0.5), z.literal(1), z.literal(1.5), z.literal(2)]),
  spacingScale: z.union([z.literal(0.875), z.literal(1), z.literal(1.125)]),
  motionScale: z.union([z.literal(0), z.literal(0.5), z.literal(1), z.literal(1.5)]),
  elevationStyle: elevationStyleSchema,
  typography: themeTypographySchema,
  surface: themeSurfaceSchema,
})

export type ThemeConfigInput = z.input<typeof themeConfigSchema>
