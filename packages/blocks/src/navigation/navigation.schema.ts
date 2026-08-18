import { z } from 'zod'

import { HREF_MAX_LENGTH } from '../marketing/marketing.schema'
import { visibility } from '../scales'

/**
 * The vocabulary the six navigation blocks share.
 *
 * A link is a label and an href, and a top-level one may open a single level of children. One level is
 * the whole of it: a nested menu needs a submenu keyboard model, and a marketing site that needs one
 * needs a sitemap instead.
 */
export const NAV_LABEL_MAX_LENGTH = 40
export const NAV_DESCRIPTION_MAX_LENGTH = 140
export const ICON_NAME_MAX_LENGTH = 40
export const MAX_NAV_ITEMS = 6
export const MAX_NAV_CHILDREN = 6

/** `min(1)` on every label in this file: an unnamed link is the defect the category exists to prevent. */
export const navLinkSchema = z.object({
  label: z.string().min(1).max(NAV_LABEL_MAX_LENGTH).default('Docs'),
  href: z.string().max(HREF_MAX_LENGTH).default('#'),
})

export type NavLink = z.infer<typeof navLinkSchema>

export const navChildSchema = navLinkSchema.extend({
  description: z.string().max(NAV_DESCRIPTION_MAX_LENGTH).default(''),
})

export type NavChild = z.infer<typeof navChildSchema>

export const navItemSchema = navLinkSchema.extend({
  children: z.array(navChildSchema).max(MAX_NAV_CHILDREN).default([]),
})

export type NavItem = z.infer<typeof navItemSchema>

export const BRAND_MAX_LENGTH = 32

export const brandFields = (label: string) => ({
  brandLabel: z.string().min(1).max(BRAND_MAX_LENGTH).default(label),
  brandHref: z.string().max(HREF_MAX_LENGTH).default('/'),
})

export interface BrandShape {
  readonly brandLabel: string
  readonly brandHref: string
}

/**
 * The landmark's own label and the responsive visibility flag — the two fields every block in the
 * category has. The label is a prop because a page with two navigations needs two names, and an
 * unlabelled `<nav>` is announced as "navigation" twice.
 */
export const navFrameFields = (ariaLabel: string) => ({
  ariaLabel: z.string().min(1).max(NAV_LABEL_MAX_LENGTH).default(ariaLabel),
  hidden: visibility,
})

export interface NavFrameShape {
  readonly ariaLabel: string
  readonly hidden: boolean
}

/** Which href is the page the reader is on. Empty means none, which is the honest answer in a canvas. */
export const activeHrefField = () => ({
  activeHref: z.string().max(HREF_MAX_LENGTH).default(''),
})

export interface ActiveShape {
  readonly activeHref: string
}

export const isActiveHref = (href: string, activeHref: string): boolean =>
  activeHref !== '' && href === activeHref

/**
 * The drawer trigger and its close button, and they are constants rather than props on purpose: an
 * accessible name a document can clear is a name a document can get wrong, and this is the one control a
 * mobile screen-reader user cannot work around.
 */
export const OPEN_MENU_LABEL = 'Open menu'
export const CLOSE_MENU_LABEL = 'Close menu'

export const MAX_SOCIALS = 6

export const socialSchema = z.object({
  network: z.string().min(1).max(NAV_LABEL_MAX_LENGTH).default('GitHub'),
  href: z.string().max(HREF_MAX_LENGTH).default('#'),
  icon: z.string().max(ICON_NAME_MAX_LENGTH).default('external-link'),
})

export type Social = z.infer<typeof socialSchema>

/**
 * "Motion Studio on GitHub", never "GitHub" — the name says where the link goes rather than what the
 * glyph looks like. Derived rather than authored, so no document can ship the short version.
 */
export const socialAccessibleName = (brand: string, network: string): string =>
  brand === '' ? `Open ${network}` : `${brand} on ${network}`
