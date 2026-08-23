import { type MarkupElement, children, defineMarkup, el, literal, txt } from '@motion-studio/schema'

import { iconMarkup } from '../../markup/icon'
import { ICON_SIZE } from '../interactive.styles'

import { groupItemValue, multipleDefault, singleDefault } from './button-group.schema'
import { groupItemStyles, groupRootStyles } from './button-group.styles'
import type { ButtonGroupProps } from './button-group.types'

/**
 * Radio in single mode and toggle in multiple mode, with the state Radix writes on the first frame.
 * Which one is chosen after that is behaviour; which one it opens with is the document's.
 */
export const buttonGroupMarkup = defineMarkup<ButtonGroupProps>(
  ({ props: { items, mode, look, size, defaultSelected, ariaLabel, hidden } }) => {
    const glyph = ICON_SIZE[size]
    const chosen =
      mode === 'multiple'
        ? new Set(multipleDefault(defaultSelected, items.length))
        : new Set([singleDefault(defaultSelected, items.length)])

    const item = (label: string, icon: string, index: number): MarkupElement => {
      const value = groupItemValue(index)
      const on = chosen.has(value)

      return el('button', {
        classNames: [groupItemStyles({ look, size })],
        attributes: {
          type: literal('button'),
          role: literal(mode === 'multiple' ? 'button' : 'radio'),
          ...(mode === 'multiple'
            ? { 'aria-pressed': literal(on) }
            : { 'aria-checked': literal(on) }),
          'data-state': literal(
            mode === 'multiple' ? (on ? 'on' : 'off') : on ? 'checked' : 'unchecked',
          ),
          value: literal(value),
          tabIndex: literal(-1),
          'data-orientation': literal('horizontal'),
        },
        children: children(
          iconMarkup({ name: icon, size: glyph }),
          el('span', { classNames: ['truncate'], children: [txt(label)] }),
        ),
      })
    }

    return el('div', {
      classNames: [groupRootStyles({ look, hidden })],
      attributes: {
        role: literal(mode === 'multiple' ? 'group' : 'radiogroup'),
        ...(mode === 'multiple' ? {} : { 'aria-required': literal(false) }),
        'aria-orientation': literal('horizontal'),
        dir: literal('ltr'),
        'aria-label': literal(ariaLabel),
        tabIndex: literal(0),
        'data-orientation': literal('horizontal'),
      },
      children: items.map((entry, index) => item(entry.label, entry.icon, index)),
    })
  },
)
