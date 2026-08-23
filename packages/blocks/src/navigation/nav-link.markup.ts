import { type MarkupChild, type MarkupElement, el, literal } from '@motion-studio/schema'
import { cn } from '@motion-studio/utils'

import { isActiveHref } from './navigation.schema'
import { navLinkStyles } from './navigation.styles'

export interface NavLinkMarkupInput {
  readonly href: string
  readonly activeHref: string
  readonly variant: 'bar' | 'drawer' | 'rail' | 'panel'
  readonly className?: string | undefined
  readonly children: readonly MarkupChild[]
}

/**
 * `NavLink` as markup. `aria-current="page"` is decided by the same predicate the component uses, so
 * the exported page signals the current entry the way ACCESSIBILITY.md § Non-negotiables 4 requires —
 * on the element, not only in a colour.
 */
export function navLinkMarkup({
  href,
  activeHref,
  variant,
  className,
  children,
}: NavLinkMarkupInput): MarkupElement {
  const active = isActiveHref(href, activeHref)

  return el('a', {
    classNames: [cn(navLinkStyles({ variant, active }), className)],
    attributes: {
      ...(active ? { 'aria-current': literal('page') } : {}),
      'data-active': literal(active),
      href: literal(href),
    },
    children,
  })
}
