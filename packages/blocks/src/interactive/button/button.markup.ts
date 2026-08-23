import { children, defineMarkup, el, literal, txt } from '@motion-studio/schema'

import { iconMarkup } from '../../markup/icon'
import { ICON_SIZE } from '../interactive.styles'

import { BUTTON_SPINNER, buttonStyles } from './button.styles'
import type { ButtonProps } from './button.types'

export const buttonMarkup = defineMarkup<ButtonProps>(
  ({
    props: {
      label,
      href,
      variant,
      size,
      leadingIcon,
      trailingIcon,
      loading,
      loadingLabel,
      fullWidth,
      hidden,
    },
  }) => {
    const glyph = ICON_SIZE[size]
    const content = children(
      loading
        ? iconMarkup({ name: 'loading', size: glyph, className: BUTTON_SPINNER })
        : iconMarkup({ name: leadingIcon, size: glyph }),
      txt(label),
      loading && el('span', { classNames: ['sr-only'], children: [txt(loadingLabel)] }),
      !loading && iconMarkup({ name: trailingIcon, size: glyph }),
    )
    const state = loading ? { 'aria-busy': literal(true), 'aria-disabled': literal(true) } : {}
    const classNames = [buttonStyles({ variant, size, fullWidth, hidden })]

    return href === ''
      ? el('button', {
          classNames,
          attributes: { ...state, type: literal('button') },
          children: content,
        })
      : el('a', { classNames, attributes: { ...state, href: literal(href) }, children: content })
  },
)
