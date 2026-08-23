import { children, defineMarkup, el, literal, txt } from '@motion-studio/schema'

import { iconMarkup } from '../../markup/icon'
import { ICON_SIZE } from '../interactive.styles'

import { CHOICE_ICONS, type ColorModeChoice, visibleChoices } from './theme-toggle.schema'
import { toggleChoiceStyles, toggleRootStyles } from './theme-toggle.styles'
import type { ThemeToggleProps } from './theme-toggle.types'

/**
 * The control as it stands before the stored preference is read — `system`, which is what the component
 * renders on the first frame for the same reason: the server has no `localStorage`, and an export has no
 * server either.
 */
export const themeToggleMarkup = defineMarkup<ThemeToggleProps>(
  ({
    props: { variant, size, includeSystem, lightLabel, darkLabel, systemLabel, ariaLabel, hidden },
  }) => {
    const labels: Readonly<Record<ColorModeChoice, string>> = {
      light: lightLabel,
      dark: darkLabel,
      system: systemLabel,
    }

    return el('div', {
      classNames: [toggleRootStyles({ hidden })],
      attributes: { 'aria-label': literal(ariaLabel), role: literal('group') },
      children: visibleChoices(includeSystem).map((mode) =>
        el('button', {
          classNames: [toggleChoiceStyles({ variant, size })],
          attributes: { 'aria-pressed': literal(mode === 'system'), type: literal('button') },
          children: children(
            iconMarkup({ name: CHOICE_ICONS[mode], size: ICON_SIZE[size] }),
            variant === 'segmented'
              ? txt(labels[mode])
              : el('span', { classNames: ['sr-only'], children: [txt(labels[mode])] }),
          ),
        }),
      ),
    })
  },
)
