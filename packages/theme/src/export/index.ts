import { toCssVariables } from './css-variables'
import { toFigmaTokens } from './figma-tokens'
import { toTailwindConfig } from './tailwind-config'
import { toTokensJson } from './tokens-json'

import type { ThemeExport } from './theme-export'

export { toCssVariables } from './css-variables'
export { toFigmaTokens } from './figma-tokens'
export { toTailwindConfig } from './tailwind-config'
export { toTokensJson } from './tokens-json'
export {
  exportedAccent,
  overrideNotes,
  resolveForExport,
  warningNotes,
  type ThemeExport,
} from './theme-export'

export type TokenFormatId = 'css' | 'tailwind' | 'json' | 'figma'

export interface TokenFormat {
  readonly id: TokenFormatId
  readonly label: string
  /** The name the download lands under, so the dialog does not have to invent one. */
  readonly filename: string
  readonly mediaType: string
  readonly print: (theme: ThemeExport) => string
}

/** The four formats of `THEME_ENGINE.md` § Theme in export, in the order that section lists them. */
export const TOKEN_FORMATS: readonly TokenFormat[] = [
  {
    id: 'css',
    label: 'CSS variables',
    filename: 'theme.css',
    mediaType: 'text/css',
    print: toCssVariables,
  },
  {
    id: 'tailwind',
    label: 'Tailwind config',
    filename: 'tailwind.config.ts',
    mediaType: 'text/plain',
    print: toTailwindConfig,
  },
  {
    id: 'json',
    label: 'JSON',
    filename: 'theme.json',
    mediaType: 'application/json',
    print: toTokensJson,
  },
  {
    id: 'figma',
    label: 'Figma Tokens',
    filename: 'figma-tokens.json',
    mediaType: 'application/json',
    print: toFigmaTokens,
  },
]
