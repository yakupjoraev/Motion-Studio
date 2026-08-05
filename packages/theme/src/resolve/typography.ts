import { FONT_FAMILY, TYPE_SCALE, type TypeScaleToken } from '@motion-studio/tokens'

import type { BaseSize, FontPairingId } from '../theme.types'

/**
 * `DESIGN_SYSTEM.md` § Families ships one pairing; `THEME_ENGINE.md` § ThemeConfig names more. Every
 * stack ends in a generic keyword because CSS requires one, and every non-system family is self-hosted
 * through `next/font` — ADR-025.
 */
export const FONT_PAIRING: Readonly<
  Record<
    FontPairingId,
    {
      readonly label: string
      readonly sans: string
      readonly display: string
      readonly mono: string
    }
  >
> = {
  geist: {
    label: 'Geist / Geist Mono',
    sans: FONT_FAMILY.sans,
    display: FONT_FAMILY.display,
    mono: FONT_FAMILY.mono,
  },
  'inter-mono': {
    label: 'Inter / JetBrains Mono',
    sans: "'Inter', system-ui, sans-serif",
    display: "'Inter', system-ui, sans-serif",
    mono: "'JetBrains Mono', ui-monospace, monospace",
  },
  'satoshi-jet': {
    label: 'Satoshi / JetBrains Mono',
    sans: "'Satoshi', system-ui, sans-serif",
    display: "'Satoshi', system-ui, sans-serif",
    mono: "'JetBrains Mono', ui-monospace, monospace",
  },
  'sohne-berkeley': {
    label: 'Söhne / Berkeley Mono',
    sans: "'Söhne', system-ui, sans-serif",
    display: "'Söhne', system-ui, sans-serif",
    mono: "'Berkeley Mono', ui-monospace, monospace",
  },
  system: {
    label: 'System',
    sans: 'system-ui, sans-serif',
    display: 'system-ui, sans-serif',
    mono: 'ui-monospace, monospace',
  },
}

/** The base the shipped scale is authored at — `DESIGN_SYSTEM.md` § Scale, "Studio base is 14 px". */
const AUTHORED_BASE = 14

export interface ScaledType {
  readonly size: string
  readonly lineHeight: string
  readonly tracking: string
}

const scalePx = (value: string, factor: number): string =>
  `${Math.round(Number.parseFloat(value) * factor * 10) / 10}px`

/**
 * The scale at a given base size. Every fixed step and its line height scale by `baseSize / 14`, which
 * preserves the authored proportions rather than regenerating them from a ratio the table does not
 * follow (ADR-024). Tracking is in `em` and is already proportional.
 *
 * The two `display-*` steps are `clamp()` over viewport units — content typography, not studio density —
 * and pass through unchanged.
 */
export function scaleTypeScale(baseSize: BaseSize): Readonly<Record<TypeScaleToken, ScaledType>> {
  const factor = baseSize / AUTHORED_BASE
  const entries = Object.entries(TYPE_SCALE).map(([token, entry]) => {
    const fixed = entry.size.endsWith('px')

    return [
      token,
      {
        size: fixed ? scalePx(entry.size, factor) : entry.size,
        lineHeight:
          fixed && entry.lineHeight.endsWith('px')
            ? scalePx(entry.lineHeight, factor)
            : entry.lineHeight,
        tracking: entry.tracking,
      },
    ]
  })

  return Object.fromEntries(entries) as Readonly<Record<TypeScaleToken, ScaledType>>
}
