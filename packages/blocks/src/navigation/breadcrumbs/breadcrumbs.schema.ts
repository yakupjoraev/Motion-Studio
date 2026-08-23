import { z } from 'zod'

import { type NavLink, navFrameFields, navLinkSchema } from '../navigation.schema'

export const MAX_BREADCRUMB_ITEMS = 8
/** Below three there is nothing to collapse: a first crumb, a menu and a last crumb is the floor. */
export const MIN_VISIBLE_CRUMBS = 3

export const BREADCRUMB_SEPARATORS = ['chevron', 'slash'] as const

export type BreadcrumbSeparator = (typeof BREADCRUMB_SEPARATORS)[number]

export const breadcrumbsSchema = z.object({
  items: z
    .array(navLinkSchema)
    .min(1)
    .max(MAX_BREADCRUMB_ITEMS)
    .default([
      { label: 'Docs', href: '#docs' },
      { label: 'Blocks', href: '#blocks' },
      { label: 'Navigation', href: '#navigation' },
      { label: 'Breadcrumbs', href: '#breadcrumbs' },
    ]),
  /** How many crumbs are drawn before the middle folds into a menu. The trigger is not one of them. */
  maxVisible: z.number().int().min(MIN_VISIBLE_CRUMBS).max(MAX_BREADCRUMB_ITEMS).default(4),
  separator: z.enum(BREADCRUMB_SEPARATORS).default('chevron'),
  /**
   * Emit `BreadcrumbList` JSON-LD **in the export**, never in the canvas. Off by default for the reason
   * `faq-accordion` gives about `FAQPage`: structured data that does not match the page is a penalty.
   */
  jsonLd: z.boolean().default(false),
  ...navFrameFields('Breadcrumb'),
})

export type BreadcrumbsProps = z.infer<typeof breadcrumbsSchema>

/** A drawn crumb, or the menu that holds the ones that did not fit. */
export type BreadcrumbSlot =
  | { readonly kind: 'crumb'; readonly item: NavLink; readonly last: boolean }
  | { readonly kind: 'overflow'; readonly hidden: readonly NavLink[] }

/**
 * Which crumbs are drawn and which fold into the menu.
 *
 * The first crumb and the last `maxVisible - 1` survive: the first says where the trail starts and the
 * tail says where the reader is, and everything between them is the part a long trail can lose without
 * losing its meaning. Dropping from the tail instead would hide the reader's own position.
 *
 * A pure function because it is the one thing in this block with a decision in it, and a decision that is
 * a function is a decision a test can pin down.
 */
/** "Show 3 hidden levels" — a count, because "more" does not say how much more. */
export const overflowLabel = (count: number): string =>
  `Show ${count} hidden ${count === 1 ? 'level' : 'levels'}`

export function collapseBreadcrumbs(
  items: readonly NavLink[],
  maxVisible: number,
): readonly BreadcrumbSlot[] {
  const crumb = (item: NavLink, index: number): BreadcrumbSlot => ({
    kind: 'crumb',
    item,
    last: index === items.length - 1,
  })

  if (items.length <= maxVisible) {
    return items.map(crumb)
  }

  const tailLength = maxVisible - 1
  const head = items.slice(0, 1)
  const hidden = items.slice(1, items.length - tailLength)
  const tail = items.slice(items.length - tailLength)

  return [
    ...head.map((item, index) => crumb(item, index)),
    { kind: 'overflow', hidden },
    ...tail.map((item, index) => crumb(item, items.length - tailLength + index)),
  ]
}
