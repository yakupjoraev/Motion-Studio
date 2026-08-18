import { cn } from '@motion-studio/utils'
import type { AnchorHTMLAttributes, ReactNode } from 'react'

import { isActiveHref } from './navigation.schema'
import { navLinkStyles } from './navigation.styles'

export interface NavLinkProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'className' | 'children'> {
  readonly href: string
  readonly activeHref: string
  readonly variant: 'bar' | 'drawer' | 'rail' | 'panel'
  readonly className?: string | undefined
  readonly children: ReactNode
}

/**
 * One navigation link, in one of the four shapes the category uses.
 *
 * It exists so that `aria-current="page"` is decided once. Six blocks each deciding what "the current
 * page" means is six chances to signal it with a colour and nothing else, which
 * ACCESSIBILITY.md § Non-negotiables 4 forbids — here the state is on the element, in the weight, and
 * in a rule beside the label.
 *
 * The rest props are spread first and deliberately: Radix hands its own handlers and ref down through
 * `asChild`, and a component that swallowed them would leave the dropdown's keyboard model behind.
 */
export function NavLink({ href, activeHref, variant, className, children, ...rest }: NavLinkProps) {
  const active = isActiveHref(href, activeHref)

  return (
    <a
      {...rest}
      aria-current={active ? 'page' : undefined}
      className={cn(navLinkStyles({ variant, active }), className)}
      data-active={active}
      data-testid="nav-link"
      href={href}
    >
      {children}
    </a>
  )
}
