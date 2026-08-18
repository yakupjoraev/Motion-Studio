import { NavIcon } from '../nav-icon'
import { type Social, socialAccessibleName } from '../navigation.schema'
import { NAV_ICON_BUTTON } from '../navigation.styles'

import { FOOTER_SOCIALS } from './footer.styles'

export interface FooterSocialsProps {
  readonly socials: readonly Social[]
  readonly brandLabel: string
}

/**
 * The social row.
 *
 * The accessible name is **derived**, not authored: `socialAccessibleName` produces "Motion Studio on
 * GitHub" from the brand and the network, so no document can ship a link named after its glyph. An icon
 * link called "GitHub" tells a screen-reader user what the picture is rather than where the link goes,
 * and it is the single most commonly botched detail in a footer.
 *
 * The glyph comes from our own set rather than from a brand mark — ADR-193.
 */
export function FooterSocials({ socials, brandLabel }: FooterSocialsProps) {
  if (socials.length === 0) {
    return null
  }

  return (
    <ul className={FOOTER_SOCIALS} data-testid="footer-socials">
      {socials.map((social, index) => (
        <li key={`${social.network}-${index}`}>
          <a
            aria-label={socialAccessibleName(brandLabel, social.network)}
            className={NAV_ICON_BUTTON}
            data-testid="footer-social"
            href={social.href}
            rel="noreferrer"
          >
            <NavIcon name={social.icon} size={18} />
          </a>
        </li>
      ))}
    </ul>
  )
}
