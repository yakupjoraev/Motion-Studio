import { type MarkupElement, children, el, literal } from '@motion-studio/schema'

import { iconMarkup } from '../../markup/icon'

import { BREADCRUMB_OVERFLOW_TRIGGER } from './breadcrumbs.styles'

/**
 * The folded middle of a long trail. Closed, the menu is not in the document — the trail's hidden
 * levels reach the reader through the trigger, which is what the canvas shows too.
 */
export const breadcrumbOverflowMarkup = (label: string): MarkupElement =>
  el('button', {
    classNames: [BREADCRUMB_OVERFLOW_TRIGGER],
    attributes: {
      type: literal('button'),
      'aria-haspopup': literal('menu'),
      'aria-expanded': literal(false),
      'data-state': literal('closed'),
      'aria-label': literal(label),
    },
    children: children(iconMarkup({ name: 'more-horizontal', size: 16 })),
  })
