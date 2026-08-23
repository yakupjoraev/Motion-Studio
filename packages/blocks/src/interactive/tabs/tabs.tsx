'use client'

import * as RadixTabs from '@radix-ui/react-tabs'
import { type CSSProperties, useState } from 'react'

import { ControlIcon } from '../control-icon'
import { PanelContent, panelChildren } from '../panel-content'

import { initialTab, tabIndex, tabValue } from './tabs.schema'
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

/**
 * Tabs on Radix Tabs, with an indicator that never measures anything.
 *
 * Radix owns the keyboard and the wiring: one tab stop for the list, arrows moving *and* activating, `Home`
 * and `End`, `aria-selected`, and `aria-controls`/`aria-labelledby` in both directions between a trigger and
 * its panel. Reimplementing that is the mistake every hand-rolled tab strip makes.
 *
 * The indicator is two custom properties and one translated element — ADR-203. The triggers are equal grid
 * columns, so the indicator is `100 / n` per cent wide and travels whole multiples of itself: no
 * `getBoundingClientRect`, no `ResizeObserver`, and correct at every canvas zoom, which a measured pixel
 * offset would not be inside a transform-scaled artboard.
 *
 * The selection stays in **Radix** and only the index for the indicator is state here, so editing an
 * unrelated prop cannot reset which tab is open — the property that makes a block usable in an editor.
 */
export function Tabs({
  items,
  orientation,
  align,
  defaultTab,
  ariaLabel,
  hidden,
  children,
}: TabsProps) {
  const first = initialTab(defaultTab, items.length)
  const [active, setActive] = useState(first)
  const panels = panelChildren(children)

  const variables = {
    [TABS_COUNT_VARIABLE]: items.length,
    [TABS_INDEX_VARIABLE]: active,
  } as CSSProperties

  return (
    <RadixTabs.Root
      className={tabsRootStyles({ orientation, hidden })}
      data-testid="tabs"
      defaultValue={tabValue(first)}
      onValueChange={(value) => setActive(tabIndex(value))}
      orientation={orientation}
    >
      <div
        className={tabsListFrameStyles({ orientation, align })}
        data-testid="tabs-list-frame"
        style={variables}
      >
        <RadixTabs.List aria-label={ariaLabel} className={tabsListStyles({ orientation })} loop>
          {items.map((item, index) => (
            <RadixTabs.Trigger
              className={tabTriggerStyles({ orientation })}
              data-testid="tabs-trigger"
              key={`${item.label}-${index}`}
              value={tabValue(index)}
            >
              <ControlIcon name={item.icon} size={16} />
              <span className="truncate">{item.label}</span>
            </RadixTabs.Trigger>
          ))}
        </RadixTabs.List>

        {/* Outside the list rather than inside it: a tablist's children are tabs, and a decorative
            element among them is a thing an assistive technology has to be told to ignore. */}
        <span
          aria-hidden="true"
          className={tabsIndicatorStyles({ orientation })}
          data-testid="tabs-indicator"
        />
      </div>

      {items.map((item, index) => (
        <RadixTabs.Content
          className={TABS_PANEL}
          data-testid="tabs-panel"
          // The panel a reader has not opened is still a paragraph the exported page contains, and
          // `hidden` is what keeps it out of the tab order and the accessibility tree meanwhile.
          forceMount
          hidden={index !== active}
          key={`${item.label}-${index}`}
          value={tabValue(index)}
        >
          <PanelContent body={item.body} child={panels[index]} />
        </RadixTabs.Content>
      ))}
    </RadixTabs.Root>
  )
}
