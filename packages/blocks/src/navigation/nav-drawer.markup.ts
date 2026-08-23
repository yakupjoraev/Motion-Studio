import { type MarkupElement, children, el, literal } from '@motion-studio/schema'

import { iconMarkup } from '../markup/icon'

import { NAV_DRAWER_TRIGGER } from './nav-drawer.styles'
import { OPEN_MENU_LABEL } from './navigation.schema'
import { NAV_ICON_BUTTON } from './navigation.styles'

/**
 * The drawer as an exported page holds it: the trigger, and nothing else.
 *
 * The sheet lives in a portal that exists only while the drawer is open, so a closed drawer *is* this
 * button — on the canvas and in the export alike. What opens it is behaviour: the React target keeps
 * the dialog, and the HTML target drives it from the trigger's own attributes.
 */
export const navDrawerMarkup = (): MarkupElement =>
  el('button', {
    classNames: [NAV_ICON_BUTTON, NAV_DRAWER_TRIGGER],
    attributes: {
      type: literal('button'),
      'aria-haspopup': literal('dialog'),
      'aria-expanded': literal(false),
      'data-state': literal('closed'),
      'aria-label': literal(OPEN_MENU_LABEL),
    },
    children: children(iconMarkup({ name: 'menu', size: 20 })),
  })
