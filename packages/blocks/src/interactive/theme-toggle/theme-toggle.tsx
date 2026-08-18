'use client'

import { setColorMode, storedColorMode } from '@motion-studio/theme'
import { useEffect, useState } from 'react'

import { ControlIcon } from '../control-icon'
import { ICON_SIZE } from '../interactive.styles'

import { CHOICE_ICONS, type ColorModeChoice, visibleChoices } from './theme-toggle.schema'
import { toggleChoiceStyles, toggleRootStyles } from './theme-toggle.styles'
import type { ThemeToggleProps } from './theme-toggle.types'

/**
 * The one block that legitimately touches application state — and what it touches is the colour mode, through
 * the theme engine's `setColorMode` (ADR-200). Everything else about it is still props in, JSX out: it reads
 * no store, knows no editor, and holds only which choice is pressed.
 *
 * The stored preference is read in an **effect** rather than during render, because the server has no
 * `localStorage`: rendering "system" first and correcting it after mount is what keeps the markup the server
 * sent and the markup the client expects identical. The theme itself does not flash, because the blocking
 * inline script in `<head>` has already set the attribute before first paint.
 *
 * Three individually tabbable buttons in a labelled group, with `aria-pressed` on each. Not a radio group: a
 * radio group's arrow keys have to *check* what they move to (ADR-208) and this block cannot use a primitive
 * that provides it — its export has to be self-contained (ADR-201). A toggle-button group is the honest
 * announcement for what this is.
 */
export function ThemeToggle({
  variant,
  size,
  includeSystem,
  lightLabel,
  darkLabel,
  systemLabel,
  ariaLabel,
  hidden,
}: ThemeToggleProps) {
  const [choice, setChoice] = useState<ColorModeChoice>('system')

  useEffect(() => {
    setChoice(storedColorMode() ?? 'system')
  }, [])

  const labels: Readonly<Record<ColorModeChoice, string>> = {
    light: lightLabel,
    dark: darkLabel,
    system: systemLabel,
  }

  const select = (next: ColorModeChoice): void => {
    setColorMode(next)
    setChoice(next)
  }

  return (
    <div
      aria-label={ariaLabel}
      className={toggleRootStyles({ hidden })}
      data-testid="theme-toggle"
      // biome-ignore lint/a11y/useSemanticElements: <fieldset> is for form controls whose value is submitted; three toggle buttons on a page are not a form
      role="group"
    >
      {visibleChoices(includeSystem).map((mode) => (
        <button
          aria-pressed={choice === mode}
          className={toggleChoiceStyles({ variant, size })}
          data-testid="theme-toggle-choice"
          key={mode}
          onClick={() => select(mode)}
          type="button"
        >
          <ControlIcon name={CHOICE_ICONS[mode]} size={ICON_SIZE[size]} />
          {variant === 'segmented' ? labels[mode] : <span className="sr-only">{labels[mode]}</span>}
        </button>
      ))}
    </div>
  )
}
