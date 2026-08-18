import { z } from 'zod'

import { headingLevel } from '../../marketing/marketing.schema'
import {
  MAX_SOCIALS,
  NAV_DESCRIPTION_MAX_LENGTH,
  NAV_LABEL_MAX_LENGTH,
  activeHrefField,
  brandFields,
  navFrameFields,
  navLinkSchema,
  socialSchema,
} from '../navigation.schema'

export const MAX_FOOTER_COLUMNS = 4
export const MAX_FOOTER_LINKS = 6
export const MAX_LEGAL_LINKS = 4
export const COPYRIGHT_MAX_LENGTH = 80

export const footerColumnSchema = z.object({
  title: z.string().min(1).max(NAV_LABEL_MAX_LENGTH).default('Product'),
  links: z
    .array(navLinkSchema)
    .max(MAX_FOOTER_LINKS)
    .default([{ label: 'Overview', href: '#overview' }]),
})

export type FooterColumn = z.infer<typeof footerColumnSchema>

const DEFAULT_COLUMNS: readonly FooterColumn[] = [
  {
    title: 'Product',
    links: [
      { label: 'Studio', href: '#studio' },
      { label: 'Blocks', href: '#blocks' },
      { label: 'Export', href: '#export' },
      { label: 'Changelog', href: '#changelog' },
    ],
  },
  {
    title: 'Docs',
    links: [
      { label: 'Getting started', href: '#start' },
      { label: 'Motion', href: '#motion' },
      { label: 'Theming', href: '#theming' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '#about' },
      { label: 'Contact', href: '#contact' },
    ],
  },
]

export const footerSchema = z.object({
  ...brandFields('Motion Studio'),
  tagline: z
    .string()
    .max(NAV_DESCRIPTION_MAX_LENGTH)
    .default('A visual editor for modern React interfaces. The export is the product.'),
  columns: z
    .array(footerColumnSchema)
    .max(MAX_FOOTER_COLUMNS)
    .default(DEFAULT_COLUMNS.map((column) => ({ ...column, links: [...column.links] }))),
  socials: z
    .array(socialSchema)
    .max(MAX_SOCIALS)
    .default([
      { network: 'GitHub', href: '#github', icon: 'code' },
      { network: 'X', href: '#x', icon: 'external-link' },
      { network: 'YouTube', href: '#youtube', icon: 'video' },
    ]),
  legal: z
    .array(navLinkSchema)
    .max(MAX_LEGAL_LINKS)
    .default([
      { label: 'Privacy', href: '#privacy' },
      { label: 'Terms', href: '#terms' },
    ]),
  copyright: z.string().max(COPYRIGHT_MAX_LENGTH).default('© Motion Studio'),
  /** The slot's own switch: a footer with an empty signup column looks like a footer that failed. */
  showNewsletter: z.boolean().default(true),
  headingLevel,
  ...activeHrefField(),
  ...navFrameFields('Footer'),
})

export type FooterProps = z.infer<typeof footerSchema>
