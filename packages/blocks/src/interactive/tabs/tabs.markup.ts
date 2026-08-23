import { children, defineMarkup, el, literal, txt } from '@motion-studio/schema'

import { iconMarkup } from '../../markup/icon'
import { panelContentMarkup } from '../panel-content.markup'

import { initialTab } from './tabs.schema'
import {
  TABS_COUNT_VARIABLE,
  TABS_INDEX_VARIABLE,
  TABS_PANEL,
  tabTriggerStyles,
  tabsIndicatorStyles,
  tabsListFrameStyles,
  tabsListStyles,
  tabsRootStyles,
} from './tabs.styles'
import type { TabsProps } from './tabs.types'

export const tabsMarkup = defineMarkup<TabsProps>(
  ({ props: { items, orientation, align, defaultTab, ariaLabel, hidden }, id }) => {
    const active = initialTab(defaultTab, items.length)

    return el('div', {
      classNames: [tabsRootStyles({ orientation, hidden })],
      attributes: { dir: literal('ltr'), 'data-orientation': literal(orientation) },
      children: [
        el('div', {
          classNames: [tabsListFrameStyles({ orientation, align })],
          cssVars: {
            [TABS_COUNT_VARIABLE]: String(items.length),
            [TABS_INDEX_VARIABLE]: String(active),
          },
          children: [
            el('div', {
              classNames: [tabsListStyles({ orientation })],
              attributes: {
                role: literal('tablist'),
                'aria-orientation': literal(orientation),
                'aria-label': literal(ariaLabel),
                tabIndex: literal(0),
                'data-orientation': literal(orientation),
              },
              children: items.map((item, index) =>
                el('button', {
                  classNames: [tabTriggerStyles({ orientation })],
                  attributes: {
                    type: literal('button'),
                    role: literal('tab'),
                    'aria-selected': literal(index === active),
                    'aria-controls': literal(`${id}-panel-${index}`),
                    'data-state': literal(index === active ? 'active' : 'inactive'),
                    id: literal(`${id}-trigger-${index}`),
                    tabIndex: literal(-1),
                    'data-orientation': literal(orientation),
                  },
                  children: children(
                    iconMarkup({ name: item.icon, size: 16 }),
                    el('span', { classNames: ['truncate'], children: [txt(item.label)] }),
                  ),
                }),
              ),
            }),
            el('span', {
              classNames: [tabsIndicatorStyles({ orientation })],
              attributes: { 'aria-hidden': literal('true') },
            }),
          ],
        }),
        ...items.map((item, index) =>
          el('div', {
            classNames: [TABS_PANEL],
            attributes: {
              'data-state': literal(index === active ? 'active' : 'inactive'),
              'data-orientation': literal(orientation),
              role: literal('tabpanel'),
              'aria-labelledby': literal(`${id}-trigger-${index}`),
              id: literal(`${id}-panel-${index}`),
              ...(index === active ? {} : { hidden: literal(true) }),
              tabIndex: literal(0),
            },
            children: panelContentMarkup(item.body, index),
          }),
        ),
      ],
    })
  },
)
