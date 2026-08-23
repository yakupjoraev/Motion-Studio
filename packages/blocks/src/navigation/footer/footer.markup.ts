import { children, defineMarkup, el, literal, slot, txt } from '@motion-studio/schema'

import type { HeadingLevel } from '../../marketing/marketing.schema'
import { sectionHeadingMarkup } from '../../marketing/section-heading.markup'
import { iconMarkup } from '../../markup/icon'
import { navLinkMarkup } from '../nav-link.markup'
import { type Social, socialAccessibleName } from '../navigation.schema'
import { NAV_BRAND, NAV_GROUP_HEADING, NAV_ICON_BUTTON } from '../navigation.styles'

import type { FooterColumn } from './footer.schema'
import {
  FOOTER_BRAND_COLUMN,
  FOOTER_COLUMN,
  FOOTER_COLUMN_LIST,
  FOOTER_COPYRIGHT,
  FOOTER_INNER,
  FOOTER_LEGAL,
  FOOTER_LEGAL_LINK,
  FOOTER_LEGAL_LIST,
  FOOTER_LINK,
  FOOTER_NEWSLETTER,
  FOOTER_SOCIALS,
  FOOTER_TAGLINE,
  FOOTER_TOP,
  footerStyles,
} from './footer.styles'
import type { FooterProps } from './footer.types'

/** The accessible name is derived from the brand, so no document ships a link named after its glyph. */
const socialsMarkup = (socials: readonly Social[], brandLabel: string) =>
  socials.length === 0
    ? null
    : el('ul', {
        classNames: [FOOTER_SOCIALS],
        children: socials.map((social) =>
          el('li', {
            children: [
              el('a', {
                classNames: [NAV_ICON_BUTTON],
                attributes: {
                  'aria-label': literal(socialAccessibleName(brandLabel, social.network)),
                  href: literal(social.href),
                  rel: literal('noreferrer'),
                },
                children: children(iconMarkup({ name: social.icon, size: 18 })),
              }),
            ],
          }),
        ),
      })

/** A column with no links is not a landmark: it renders the heading and stops. */
const columnMarkup = (column: FooterColumn, activeHref: string, headingLevel: HeadingLevel) => {
  const heading = sectionHeadingMarkup({
    className: NAV_GROUP_HEADING,
    level: headingLevel,
    children: [txt(column.title)],
  })

  if (column.links.length === 0) {
    return el('div', { classNames: [FOOTER_COLUMN], children: [heading] })
  }

  return el('nav', {
    classNames: [FOOTER_COLUMN],
    attributes: { 'aria-label': literal(column.title) },
    children: [
      heading,
      el('ul', {
        classNames: [FOOTER_COLUMN_LIST],
        children: column.links.map((link) =>
          el('li', {
            children: [
              navLinkMarkup({
                activeHref,
                className: FOOTER_LINK,
                href: link.href,
                variant: 'bar',
                children: [txt(link.label)],
              }),
            ],
          }),
        ),
      }),
    ],
  })
}

export const footerMarkup = defineMarkup<FooterProps>(
  ({
    props: {
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
    },
  }) =>
    el('footer', {
      classNames: [footerStyles({ hidden })],
      attributes: { 'aria-label': literal(ariaLabel) },
      children: [
        el('div', {
          classNames: [FOOTER_INNER],
          children: [
            el('div', {
              classNames: [FOOTER_TOP],
              children: children(
                el('div', {
                  classNames: [FOOTER_BRAND_COLUMN],
                  children: children(
                    el('a', {
                      classNames: [NAV_BRAND],
                      attributes: { href: literal(brandHref) },
                      children: [txt(brandLabel)],
                    }),
                    tagline !== '' &&
                      el('p', { classNames: [FOOTER_TAGLINE], children: [txt(tagline)] }),
                    socialsMarkup(socials, brandLabel),
                    showNewsletter &&
                      el('div', {
                        classNames: [FOOTER_NEWSLETTER],
                        slotGate: { slot: 'newsletter', when: 'filled' },
                        children: [slot('newsletter')],
                      }),
                  ),
                }),
                ...columns.map((column) => columnMarkup(column, activeHref, headingLevel)),
              ),
            }),
            el('div', {
              classNames: [FOOTER_LEGAL],
              children: children(
                el('p', { classNames: [FOOTER_COPYRIGHT], children: [txt(copyright)] }),
                legal.length > 0 &&
                  el('ul', {
                    classNames: [FOOTER_LEGAL_LIST],
                    children: legal.map((link) =>
                      el('li', {
                        children: [
                          navLinkMarkup({
                            activeHref,
                            className: FOOTER_LEGAL_LINK,
                            href: link.href,
                            variant: 'bar',
                            children: [txt(link.label)],
                          }),
                        ],
                      }),
                    ),
                  }),
              ),
            }),
          ],
        }),
      ],
    }),
)
