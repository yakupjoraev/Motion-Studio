import { accordionDefinition } from './accordion/accordion.definition'
import { buttonGroupDefinition } from './button-group/button-group.definition'
import { buttonDefinition } from './button/button.definition'
import { carouselDefinition } from './carousel/carousel.definition'
import { commandMenuPreviewDefinition } from './command-menu-preview/command-menu-preview.definition'
import { modalTriggerDefinition } from './modal-trigger/modal-trigger.definition'
import { tabsDefinition } from './tabs/tabs.definition'
import { themeToggleDefinition } from './theme-toggle/theme-toggle.definition'
import { tooltipTargetDefinition } from './tooltip-target/tooltip-target.definition'

// COMPONENT_LIBRARY.md § Catalogue (Interactive), which is the order the palette groups them in.
export const definitions = {
  button: buttonDefinition,
  'button-group': buttonGroupDefinition,
  tabs: tabsDefinition,
  accordion: accordionDefinition,
  carousel: carouselDefinition,
  'modal-trigger': modalTriggerDefinition,
  'tooltip-target': tooltipTargetDefinition,
  'command-menu-preview': commandMenuPreviewDefinition,
  'theme-toggle': themeToggleDefinition,
} as const
