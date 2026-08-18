import { NavLink } from '../nav-link'
import { NAV_BRAND } from '../navigation.styles'

import { FooterColumn } from './footer-column'
import { FooterSocials } from './footer-socials'
import {
  FOOTER_BRAND_COLUMN,
  FOOTER_COPYRIGHT,
  FOOTER_INNER,
  FOOTER_LEGAL,
  FOOTER_LEGAL_LINK,
  FOOTER_LEGAL_LIST,
  FOOTER_NEWSLETTER,
  FOOTER_TAGLINE,
  FOOTER_TOP,
  footerStyles,
} from './footer.styles'
import type { FooterProps } from './footer.types'

/**
 * The page's `contentinfo`: a brand column, up to four labelled link columns, a signup slot, and a legal
 * row.
 *
 * Each column is its own labelled `<nav>`, so the landmark list reads as "Product", "Docs", "Company"
 * rather than as three anonymous navigations. The socials are icon links whose names are derived from the
 * brand and the network, which is the detail a footer usually gets wrong.
 */
export function Footer({
  brandLabel,
  brandHref,
  tagline,
  columns,
  socials,
  legal,
  copyright,
  showNewsletter,
  headingLevel,
  activeHref,
  ariaLabel,
  hidden,
  newsletter,
  children,
}: FooterProps) {
  const slot = newsletter ?? children

  return (
    <footer aria-label={ariaLabel} className={footerStyles({ hidden })} data-testid="footer">
      <div className={FOOTER_INNER}>
        <div className={FOOTER_TOP}>
          <div className={FOOTER_BRAND_COLUMN}>
            <a className={NAV_BRAND} data-testid="footer-brand" href={brandHref}>
              {brandLabel}
            </a>

            {tagline !== '' && <p className={FOOTER_TAGLINE}>{tagline}</p>}

            <FooterSocials brandLabel={brandLabel} socials={socials} />

            {showNewsletter && slot !== undefined && (
              <div className={FOOTER_NEWSLETTER} data-testid="footer-newsletter">
                {slot}
              </div>
            )}
          </div>

          {columns.map((column, index) => (
            <FooterColumn
              activeHref={activeHref}
              column={column}
              headingLevel={headingLevel}
              key={`${column.title}-${index}`}
            />
          ))}
        </div>

        <div className={FOOTER_LEGAL}>
          <p className={FOOTER_COPYRIGHT}>{copyright}</p>

          {legal.length > 0 && (
            <ul className={FOOTER_LEGAL_LIST} data-testid="footer-legal">
              {legal.map((link, index) => (
                <li key={`${link.label}-${index}`}>
                  <NavLink
                    activeHref={activeHref}
                    className={FOOTER_LEGAL_LINK}
                    href={link.href}
                    variant="bar"
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </footer>
  )
}
