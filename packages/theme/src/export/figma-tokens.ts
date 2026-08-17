import { formatHex, parseOklch } from '@motion-studio/utils'

import { overrideNotes, warningNotes } from './theme-export'

import type { ThemeExport } from './theme-export'

/**
 * The W3C-ish design-tokens format the Figma Tokens plugin reads. Two differences from the other
 * three printers, both forced by the destination:
 *
 * 1. **Colours are hex.** The plugin writes Figma paints, and Figma has no OKLCH. `formatHex` clamps
 *    chroma into sRGB at the same lightness and hue, so a wide-gamut accent lands on the nearest
 *    colour Figma can hold rather than on three independently clipped channels.
 * 2. **Only colour, dimension and typography groups are emitted.** Our shadows and durations are CSS
 *    strings — `0 1px 2px …`, `calc(240ms * var(…))` — and the format's `shadow` and `duration` types
 *    are structured values. Emitting the strings under those types would produce a file the plugin
 *    rejects, so they are left out rather than mislabelled.
 */

type TokenGroup = Record<string, { $type: string; $value: string }>

const groupOf = (
  variables: Readonly<Record<string, string>>,
  prefix: string,
  type: string,
  transform: (value: string) => string = (value) => value,
  reject: readonly string[] = [],
): TokenGroup => {
  const group: TokenGroup = {}

  for (const [name, value] of Object.entries(variables)) {
    if (!name.startsWith(prefix) || reject.some((suffix) => name.endsWith(suffix))) {
      continue
    }

    group[name.slice(prefix.length)] = { $type: type, $value: transform(value) }
  }

  return group
}

const toHex = (value: string): string => formatHex(parseOklch(value))

export function toFigmaTokens(theme: ThemeExport): string {
  const notes = [...overrideNotes(theme), ...warningNotes(theme)]
  const light = theme.light.variables
  const document = {
    $description: [`Theme: ${theme.config.name}`, ...notes].join(' — '),
    color: {
      light: groupOf(light, '--ms-color-', 'color', toHex),
      dark: groupOf(theme.dark.variables, '--ms-color-', 'color', toHex),
    },
    radius: groupOf(light, '--ms-radius-', 'dimension'),
    space: groupOf(light, '--ms-space-', 'dimension'),
    fontSize: groupOf(light, '--ms-text-', 'dimension', undefined, ['-line-height', '-tracking']),
    fontFamily: {
      sans: { $type: 'fontFamily', $value: light['--ms-font-sans'] ?? '' },
      display: { $type: 'fontFamily', $value: light['--ms-font-display'] ?? '' },
      mono: { $type: 'fontFamily', $value: light['--ms-font-mono'] ?? '' },
    },
  }

  return `${JSON.stringify(document, null, 2)}\n`
}
