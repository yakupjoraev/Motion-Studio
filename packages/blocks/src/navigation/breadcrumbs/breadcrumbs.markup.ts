import { children, defineMarkup, el, literal, txt } from '@motion-studio/schema'

import { iconMarkup } from '../../markup/icon'

import { breadcrumbOverflowMarkup } from './breadcrumb-overflow.markup'
import { collapseBreadcrumbs, overflowLabel } from './breadcrumbs.schema'
import {
  BREADCRUMBS_LIST,
  BREADCRUMB_CURRENT,
  BREADCRUMB_ITEM,
  BREADCRUMB_LINK,
  BREADCRUMB_SEPARATOR,
  breadcrumbsStyles,
} from './breadcrumbs.styles'
import type { BreadcrumbsProps } from './breadcrumbs.types'

export const breadcrumbsMarkup = defineMarkup<BreadcrumbsProps>(
  ({ props: { items, maxVisible, separator, ariaLabel, hidden } }) =>
    el('nav', {
      classNames: [breadcrumbsStyles({ hidden })],
      attributes: { 'aria-label': literal(ariaLabel) },
      children: [
        el('ol', {
          classNames: [BREADCRUMBS_LIST],
          children: collapseBreadcrumbs(items, maxVisible).map((entry, index) =>
            el('li', {
              classNames: [BREADCRUMB_ITEM],
              children: children(
                index > 0 &&
                  (separator === 'chevron'
                    ? iconMarkup({
                        name: 'chevron-right',
                        size: 14,
                        className: BREADCRUMB_SEPARATOR,
                      })
                    : el('span', {
                        classNames: [BREADCRUMB_SEPARATOR],
                        attributes: { 'aria-hidden': literal('true') },
                        children: [txt('/')],
                      })),
                entry.kind === 'overflow'
                  ? breadcrumbOverflowMarkup(overflowLabel(entry.hidden.length))
                  : entry.last
                    ? el('span', {
                        classNames: [BREADCRUMB_CURRENT],
                        attributes: { 'aria-current': literal('page') },
                        children: [txt(entry.item.label)],
                      })
                    : el('a', {
                        classNames: [BREADCRUMB_LINK],
                        attributes: { href: literal(entry.item.href) },
                        children: [txt(entry.item.label)],
                      }),
              ),
            }),
          ),
        }),
      ],
    }),
)
