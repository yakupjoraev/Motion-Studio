import Link from 'next/link'

import { localeHref } from '../../lib/i18n/locale-href'
import { getRequestDictionary, getRequestLocale } from '../../lib/i18n/request-locale'

export interface DocsBreadcrumbsProps {
  readonly group: string | undefined
  readonly fileName: string
}

/** The group is not a page, so it is text rather than a link — a breadcrumb that goes nowhere is worse. */
export function DocsBreadcrumbs({ group, fileName }: DocsBreadcrumbsProps) {
  const { docs } = getRequestDictionary()

  return (
    <nav aria-label={docs.breadcrumbLabel}>
      <ol className="flex flex-wrap items-center gap-2 font-mono text-2xs text-foreground-muted uppercase tracking-[0.14em]">
        <li>
          <Link
            className="rounded-sm outline-none transition-colors hover:text-foreground focus-visible:shadow-focus"
            href={localeHref(getRequestLocale(), '/docs')}
            prefetch={false}
          >
            {docs.breadcrumbRoot}
          </Link>
        </li>
        {group === undefined ? null : (
          <li aria-hidden className="text-border-strong">
            /
          </li>
        )}
        {group === undefined ? null : <li>{group}</li>}
        <li aria-hidden className="text-border-strong">
          /
        </li>
        <li aria-current="page" className="text-foreground">
          {fileName}
        </li>
      </ol>
    </nav>
  )
}
