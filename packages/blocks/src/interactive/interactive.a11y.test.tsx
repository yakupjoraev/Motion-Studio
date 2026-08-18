import type { RenderResult } from '@testing-library/react'
import { screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'

import { expectNoViolations, renderBlock } from '../test/render-block'

import { Accordion } from './accordion/accordion'
import { accordionDefinition } from './accordion/accordion.definition'
import { ButtonGroup } from './button-group/button-group'
import { buttonGroupDefinition } from './button-group/button-group.definition'
import { Button } from './button/button'
import { buttonDefinition } from './button/button.definition'
import { Carousel } from './carousel/carousel'
import { carouselDefinition } from './carousel/carousel.definition'
import { lastIndex } from './carousel/carousel.schema'
import { CommandMenuPreview } from './command-menu-preview/command-menu-preview'
import { commandMenuPreviewDefinition } from './command-menu-preview/command-menu-preview.definition'
import { definitions } from './definitions'
import { ModalTrigger } from './modal-trigger/modal-trigger'
import { modalTriggerDefinition } from './modal-trigger/modal-trigger.definition'
import { Tabs } from './tabs/tabs'
import { tabsDefinition } from './tabs/tabs.definition'
import { ThemeToggle } from './theme-toggle/theme-toggle'
import { themeToggleDefinition } from './theme-toggle/theme-toggle.definition'
import { TooltipTarget } from './tooltip-target/tooltip-target'
import { tooltipTargetDefinition } from './tooltip-target/tooltip-target.definition'

/**
 * The category's own gate, for the rules that hold across all nine rather than block by block.
 *
 * The cases are written out rather than derived from `components`, because deriving them would need a cast from
 * the render registry's `ComponentType<never>` back to each block's props, and § 1 of the contract has no room
 * for one.
 */
interface Case {
  readonly id: string
  /** How many tab stops the block adds. `command-menu-preview` is a picture, so it adds none. */
  readonly tabStops: number
  readonly render: () => RenderResult
}

const CASES: readonly Case[] = [
  { id: 'button', tabStops: 1, render: () => renderBlock(buttonDefinition, Button) },
  {
    id: 'button-group',
    // One roving tab stop for the whole group, which is what the primitive is for.
    tabStops: 1,
    render: () => renderBlock(buttonGroupDefinition, ButtonGroup),
  },
  {
    id: 'tabs',
    // The strip, then the open panel.
    tabStops: 2,
    render: () => renderBlock(tabsDefinition, Tabs),
  },
  {
    id: 'accordion',
    tabStops: accordionDefinition.defaults.items.length,
    render: () => renderBlock(accordionDefinition, Accordion),
  },
  {
    id: 'carousel',
    /*
     * Every slide, one dot per scroll position — which is fewer than the slides when two are in view — and the
     * "Next" arrow. "Previous" is disabled at the first slide, and a disabled control is not a tab stop.
     */
    tabStops:
      carouselDefinition.defaults.slides.length +
      lastIndex(carouselDefinition.defaults.slides.length, carouselDefinition.defaults.perView) +
      2,
    render: () => renderBlock(carouselDefinition, Carousel),
  },
  {
    id: 'modal-trigger',
    tabStops: 1,
    render: () => renderBlock(modalTriggerDefinition, ModalTrigger),
  },
  {
    id: 'tooltip-target',
    tabStops: 1,
    render: () => renderBlock(tooltipTargetDefinition, TooltipTarget),
  },
  {
    id: 'command-menu-preview',
    tabStops: 0,
    render: () => renderBlock(commandMenuPreviewDefinition, CommandMenuPreview),
  },
  {
    id: 'theme-toggle',
    tabStops: 3,
    render: () => renderBlock(themeToggleDefinition, ThemeToggle),
  },
]

afterEach(() => {
  document.documentElement.removeAttribute('data-color-mode')
  localStorage.clear()
})

describe.each(CASES.map((one) => [one.id, one] as const))('%s', (id, subject) => {
  it('has no axe violations at its defaults', async () => {
    const { container } = subject.render()

    await expectNoViolations(container)
  })

  it('gives every control an accessible name', () => {
    subject.render()

    for (const control of [
      ...screen.queryAllByRole('button'),
      ...screen.queryAllByRole('radio'),
      ...screen.queryAllByRole('tab'),
      ...screen.queryAllByRole('link'),
    ]) {
      // The accessible name rather than the text: a glyph-only control is named by its label, and a control
      // named by its text and a control named by an attribute are equally named.
      expect(control, `${id}: ${control.outerHTML.slice(0, 90)}`).toHaveAccessibleName()
    }
  })

  it('reaches the end of its own tab order and lets the page continue', async () => {
    subject.render()

    for (let stop = 0; stop < subject.tabStops; stop += 1) {
      await userEvent.tab()
      expect(document.body.contains(document.activeElement), `${id}: stop ${stop + 1}`).toBe(true)
      expect(document.activeElement, `${id}: stop ${stop + 1}`).not.toBe(document.body)
    }

    await userEvent.tab()

    expect(document.activeElement, id).toBe(document.body)
  })

  it('draws its focus ring on the control rather than inheriting one', () => {
    subject.render()

    const focusable = [...screen.queryAllByRole('button'), ...screen.queryAllByRole('tab')]

    for (const control of focusable) {
      expect(control.className, `${id}: ${control.textContent}`).toContain('focus-visible:outline')
    }
  })
})

describe('the category as a whole', () => {
  it('says something about its keyboard, per block', () => {
    for (const definition of Object.values(definitions)) {
      expect(definition.a11y.notes.length, definition.id).toBeGreaterThanOrEqual(4)
      expect(
        definition.a11y.notes.some((note) =>
          /keyboard|arrow|Esc|Enter|Space|focus|tab|aria-|screen reader/i.test(note),
        ),
        definition.id,
      ).toBe(true)
    }
  })

  it('carries local state and no editor state — the rule the category exists to test', () => {
    for (const definition of Object.values(definitions)) {
      expect(definition.category, definition.id).toBe('interactive')
      // A block that needed the editor would have to declare a control for it; none of them has one.
      for (const group of definition.controls) {
        for (const control of group.controls) {
          expect(control.path, definition.id).not.toMatch(/selection|editor|node/i)
        }
      }
    }
  })
})
