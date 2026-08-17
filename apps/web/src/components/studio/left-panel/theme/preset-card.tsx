'use client'

import { type ThemeConfig, ThemeScope } from '@motion-studio/theme'
import { cn } from '@motion-studio/utils'
import type { ReactNode } from 'react'

import { PresetSwatch } from './preset-swatch'

export interface PresetCardProps {
  readonly theme: ThemeConfig
  readonly applied: boolean
  readonly onApply: (theme: ThemeConfig) => void
  /** The rename and delete affordances a saved preset carries, and a shipped one does not. */
  readonly actions?: ReactNode
}

/**
 * One preset in the picker: the live preview inside a `ThemeScope`, the name under it, and the whole
 * card as the button — `THEME_ENGINE.md` § Theme builder UI.
 *
 * The scope wraps the button rather than the other way round, so the preview's variables are in scope
 * for everything inside, and the button holds phrasing content only.
 */
export function PresetCard({ theme, applied, onApply, actions }: PresetCardProps) {
  return (
    <ThemeScope className="relative" theme={theme}>
      <button
        aria-pressed={applied}
        className={cn(
          'flex w-full flex-col gap-1 rounded-md border p-1 text-left transition-colors',
          'focus-visible:shadow-focus focus-visible:outline-none',
          applied ? 'border-accent' : 'border-border hover:border-border-strong',
        )}
        data-preset={theme.id}
        onClick={() => onApply(theme)}
        type="button"
      >
        <PresetSwatch />
        <span className="truncate px-1 pb-0.5 text-[11px] text-foreground-muted">{theme.name}</span>
      </button>
      {actions === undefined ? null : (
        <span className="absolute top-1 right-1 flex gap-0.5">{actions}</span>
      )}
    </ThemeScope>
  )
}
