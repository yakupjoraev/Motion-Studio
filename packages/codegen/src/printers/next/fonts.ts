import { camel } from '@motion-studio/utils'

/**
 * A theme's font pairing, translated into what a Next project can actually load. `next/font/google`
 * self-hosts at build time, which is what `DESIGN_SYSTEM.md` § Families asks for — but only for the
 * families Google serves, and two of our pairings name licensed fonts nobody can fetch (ADR-025).
 *
 * The honest answer for those is the CSS stack the theme already wrote and a warning naming the files
 * the user has to supply. Silently substituting a lookalike would be worse than saying so.
 */
export interface FontImport {
  /** The `next/font/google` export, e.g. `Geist_Mono`. */
  readonly family: string
  /** The module constant, e.g. `geistMono`. */
  readonly local: string
  readonly variable: string
}

export interface FontPlan {
  readonly imports: readonly FontImport[]
  /** Variables that take another's value, because the pairing spends one family on both roles. */
  readonly aliases: Readonly<Record<string, string>>
  /** Named when a family cannot be fetched, so the export report can repeat it. */
  readonly unavailable: readonly string[]
}

export const SANS_VARIABLE = '--ms-font-sans'

export const DISPLAY_VARIABLE = '--ms-font-display'

export const MONO_VARIABLE = '--ms-font-mono'

const font = (family: string, variable: string): FontImport => ({
  family,
  local: camel(family),
  variable,
})

/** Display always follows sans: every pairing `THEME_ENGINE.md` ships names one family for both. */
const DISPLAY_FOLLOWS_SANS = { [DISPLAY_VARIABLE]: SANS_VARIABLE }

const SYSTEM: FontPlan = { imports: [], aliases: DISPLAY_FOLLOWS_SANS, unavailable: [] }

const PLANS: Readonly<Record<string, FontPlan>> = {
  geist: {
    imports: [font('Geist', SANS_VARIABLE), font('Geist_Mono', MONO_VARIABLE)],
    aliases: DISPLAY_FOLLOWS_SANS,
    unavailable: [],
  },
  'inter-mono': {
    imports: [font('Inter', SANS_VARIABLE), font('JetBrains_Mono', MONO_VARIABLE)],
    aliases: DISPLAY_FOLLOWS_SANS,
    unavailable: [],
  },
  'satoshi-jet': {
    imports: [font('JetBrains_Mono', MONO_VARIABLE)],
    aliases: DISPLAY_FOLLOWS_SANS,
    unavailable: ['Satoshi'],
  },
  'sohne-berkeley': {
    imports: [],
    aliases: DISPLAY_FOLLOWS_SANS,
    unavailable: ['Söhne', 'Berkeley Mono'],
  },
  /** The system stack needs no files and no import; the theme's variables already carry it. */
  system: SYSTEM,
}

export const fontPlan = (pairing: string): FontPlan => PLANS[pairing] ?? SYSTEM
