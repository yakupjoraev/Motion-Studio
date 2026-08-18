import type { HeadingLevel } from '../../marketing/marketing.schema'
import { SectionHeading } from '../../marketing/section-heading'
import { NavLink } from '../nav-link'
import { NAV_GROUP_HEADING } from '../navigation.styles'

import type { FooterColumn as FooterColumnShape } from './footer.schema'
import { FOOTER_COLUMN, FOOTER_COLUMN_LIST, FOOTER_LINK } from './footer.styles'

export interface FooterColumnProps {
  readonly column: FooterColumnShape
  readonly activeHref: string
  readonly headingLevel: HeadingLevel
}

/**
 * One column of links, and it is a `<nav>` because it is one: a group of links to elsewhere on the site.
 *
 * The name is `aria-label` rather than `aria-labelledby`, and that is the id question rather than a
 * preference: a footer needs no hook to name four columns, and an id built from a title collides the
 * moment a page holds two footers or two columns called "Docs".
 *
 * A column with no links is not a landmark. It renders the heading and stops — an empty `<nav>` in the
 * landmark list is one more thing a reader steps through to find out it is empty.
 */
export function FooterColumn({ column, activeHref, headingLevel }: FooterColumnProps) {
  const heading = (
    <SectionHeading className={NAV_GROUP_HEADING} level={headingLevel}>
      {column.title}
    </SectionHeading>
  )

  if (column.links.length === 0) {
    return (
      <div className={FOOTER_COLUMN} data-testid="footer-column">
        {heading}
      </div>
    )
  }

  return (
    <nav aria-label={column.title} className={FOOTER_COLUMN} data-testid="footer-column">
      {heading}

      <ul className={FOOTER_COLUMN_LIST}>
        {column.links.map((link, index) => (
          <li key={`${link.label}-${index}`}>
            <NavLink activeHref={activeHref} className={FOOTER_LINK} href={link.href} variant="bar">
              {link.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
