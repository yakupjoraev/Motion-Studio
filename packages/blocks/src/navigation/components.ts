import { Breadcrumbs } from './breadcrumbs/breadcrumbs'
import { Dock } from './dock/dock'
import { Footer } from './footer/footer'
import { NavbarFloating } from './navbar-floating/navbar-floating'
import { Navbar } from './navbar/navbar'
import { SidebarNav } from './sidebar-nav/sidebar-nav'

/**
 * Eagerly, for the reason ADR-187 measured on the marketing category: what these blocks add to
 * `/studio` is their *metadata*, which the store fixes at creation and no import boundary can move.
 * `lazy` would add six Suspense skeletons and a request each for a measured nothing — the numbers are
 * in ADR-196.
 */
export const components = {
  navbar: Navbar,
  'navbar-floating': NavbarFloating,
  'sidebar-nav': SidebarNav,
  footer: Footer,
  breadcrumbs: Breadcrumbs,
  dock: Dock,
} as const
