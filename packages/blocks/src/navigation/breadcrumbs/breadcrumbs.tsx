'use client'

import { ChevronRightIcon } from '@motion-studio/icons'

import { BreadcrumbOverflow } from './breadcrumb-overflow'
import { collapseBreadcrumbs } from './breadcrumbs.schema'
import {
  BREADCRUMBS_LIST,
  BREADCRUMB_CURRENT,
  BREADCRUMB_ITEM,
  BREADCRUMB_LINK,
  BREADCRUMB_SEPARATOR,
  breadcrumbsStyles,
} from './breadcrumbs.styles'
import type { BreadcrumbsProps } from './breadcrumbs.types'

/**
 * The trail: an ordered list inside a labelled navigation landmark, with the reader's own position last
 * and not a link.
 *
 * The last crumb is a `<span aria-current="page">` rather than an anchor, and that is the whole reason it
 * is not `NavLink`: a link to the page you are on is a link that does nothing, and offering it to a
 * keyboard user is a tab stop that spends their time for no result.
 *
 * **No JSON-LD here.** The `BreadcrumbList` markup belongs to the export (ADR-185's rule, and the
 * codegen descriptor says so): a `<script>` inside an artboard is markup the user can neither see nor
 * select, and it would travel into a screenshot of their page.
 */
export function Breadcrumbs({ items, maxVisible, separator, ariaLabel, hidden }: BreadcrumbsProps) {
  const slots = collapseBreadcrumbs(items, maxVisible)

  return (
    <nav aria-label={ariaLabel} className={breadcrumbsStyles({ hidden })} data-testid="breadcrumbs">
      <ol className={BREADCRUMBS_LIST}>
        {slots.map((slot, index) => (
          <li
            className={BREADCRUMB_ITEM}
            data-testid="breadcrumb-item"
            key={slot.kind === 'overflow' ? 'overflow' : `${slot.item.label}-${index}`}
          >
            {index > 0 &&
              (separator === 'chevron' ? (
                <ChevronRightIcon aria-hidden="true" className={BREADCRUMB_SEPARATOR} size={14} />
              ) : (
                <span aria-hidden="true" className={BREADCRUMB_SEPARATOR}>
                  /
                </span>
              ))}

            {slot.kind === 'overflow' ? (
              <BreadcrumbOverflow hidden={slot.hidden} />
            ) : slot.last ? (
              <span
                aria-current="page"
                className={BREADCRUMB_CURRENT}
                data-testid="breadcrumb-current"
              >
                {slot.item.label}
              </span>
            ) : (
              <a className={BREADCRUMB_LINK} data-testid="breadcrumb-link" href={slot.item.href}>
                {slot.item.label}
              </a>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
