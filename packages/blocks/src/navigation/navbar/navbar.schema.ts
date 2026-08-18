import { z } from 'zod'

import { HREF_MAX_LENGTH, MAX_ACTIONS, actionSchema } from '../../marketing/marketing.schema'
import {
  MAX_NAV_ITEMS,
  activeHrefField,
  brandFields,
  navFrameFields,
  navItemSchema,
} from '../navigation.schema'

export const SKIP_LINK_LABEL = 'Skip to content'

const DEFAULT_LINKS = [
  { label: 'Product', href: '#product', children: [] },
  {
    label: 'Docs',
    href: '',
    children: [
      {
        label: 'Getting started',
        href: '#start',
        description: 'Install, open the studio, place a block.',
      },
      { label: 'Blocks', href: '#blocks', description: 'The registry, prop by prop.' },
      {
        label: 'Export',
        href: '#export',
        description: 'React, Next, HTML and what each one emits.',
      },
    ],
  },
  { label: 'Pricing', href: '#pricing', children: [] },
  { label: 'Changelog', href: '#changelog', children: [] },
] as const

export const navbarSchema = z.object({
  ...brandFields('Motion Studio'),
  links: z
    .array(navItemSchema)
    .max(MAX_NAV_ITEMS)
    .default(DEFAULT_LINKS.map((link) => ({ ...link, children: [...link.children] }))),
  actions: z
    .array(actionSchema)
    .max(MAX_ACTIONS)
    .default([
      { label: 'Sign in', href: '#signin', variant: 'ghost' },
      { label: 'Start building', href: '#start', variant: 'primary' },
    ]),
  /** Sticky is the default because a bar that scrolls away takes the page's navigation with it. */
  sticky: z.boolean().default(true),
  /**
   * The page's skip link, rendered here because this block is the page's first landmark and the link has
   * to precede everything focusable — ADR-192.
   */
  skipLink: z.boolean().default(true),
  skipLinkTarget: z.string().max(HREF_MAX_LENGTH).default('#main'),
  ...activeHrefField(),
  ...navFrameFields('Main'),
})

export type NavbarProps = z.infer<typeof navbarSchema>
