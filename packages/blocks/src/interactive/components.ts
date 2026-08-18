import { Accordion } from './accordion/accordion'
import { ButtonGroup } from './button-group/button-group'
import { Button } from './button/button'
import { Carousel } from './carousel/carousel'
import { CommandMenuPreview } from './command-menu-preview/command-menu-preview'
import { ModalTrigger } from './modal-trigger/modal-trigger'
import { Tabs } from './tabs/tabs'
import { ThemeToggle } from './theme-toggle/theme-toggle'
import { TooltipTarget } from './tooltip-target/tooltip-target'

/**
 * Eagerly, for the reason ADR-196 measured on the navigation category: what these blocks add to `/studio` is
 * their *metadata*, which the store fixes at creation and no import boundary can move. `lazy` would add nine
 * Suspense skeletons and a request each for a measured nothing.
 */
export const components = {
  button: Button,
  'button-group': ButtonGroup,
  tabs: Tabs,
  accordion: Accordion,
  carousel: Carousel,
  'modal-trigger': ModalTrigger,
  'tooltip-target': TooltipTarget,
  'command-menu-preview': CommandMenuPreview,
  'theme-toggle': ThemeToggle,
} as const
