import { z } from 'zod'

import { MAX_ACTIONS, actionSchema } from '../../marketing/marketing.schema'
import {
  MAX_NAV_ITEMS,
  activeHrefField,
  brandFields,
  navFrameFields,
  navLinkSchema,
} from '../navigation.schema'

/**
 * Where the bar decides it is over content rather than over the top of the page. 80 px is roughly the
 * bar's own height plus its offset, so the state changes once the reader has moved the page by more than
 * the bar covers — earlier than that and the shrink fires on a trackpad twitch.
 */
export const FLOATING_SHRINK_PX = 80

export const navbarFloatingSchema = z.object({
  ...brandFields('Motion Studio'),
  /** No dropdowns: a pill is a shortcut bar, and a menu hanging off one is a menu with no room. */
  links: z
    .array(navLinkSchema)
    .max(MAX_NAV_ITEMS)
    .default([
      { label: 'Product', href: '#product' },
      { label: 'Docs', href: '#docs' },
      { label: 'Pricing', href: '#pricing' },
    ]),
  actions: z
    .array(actionSchema)
    .max(MAX_ACTIONS)
    .default([{ label: 'Start building', href: '#start', variant: 'primary' }]),
  ...activeHrefField(),
  ...navFrameFields('Main'),
})

export type NavbarFloatingProps = z.infer<typeof navbarFloatingSchema>
