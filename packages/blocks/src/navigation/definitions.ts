import { breadcrumbsDefinition } from './breadcrumbs/breadcrumbs.definition'
import { dockDefinition } from './dock/dock.definition'
import { footerDefinition } from './footer/footer.definition'
import { navbarFloatingDefinition } from './navbar-floating/navbar-floating.definition'
import { navbarDefinition } from './navbar/navbar.definition'
import { sidebarNavDefinition } from './sidebar-nav/sidebar-nav.definition'

// COMPONENT_LIBRARY.md § Catalogue (Navigation), which is the order the palette groups them in.
export const definitions = {
  navbar: navbarDefinition,
  'navbar-floating': navbarFloatingDefinition,
  'sidebar-nav': sidebarNavDefinition,
  footer: footerDefinition,
  breadcrumbs: breadcrumbsDefinition,
  dock: dockDefinition,
} as const
