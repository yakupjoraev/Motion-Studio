import { screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'
import { requireAt } from '../../test/require-at'

import { CLOSE_MENU_LABEL, OPEN_MENU_LABEL } from '../navigation.schema'
import { Navbar } from './navbar'
import { navbarDefinition as definition } from './navbar.definition'

import { SKIP_LINK_LABEL } from './navbar.schema'

describe('Navbar', () => {
  it('is one labelled navigation landmark', () => {
    renderBlock(definition, Navbar)

    const landmarks = screen.getAllByRole('navigation')

    expect(landmarks).toHaveLength(1)
    expect(landmarks[0]).toHaveAccessibleName(definition.defaults.ariaLabel)
  })

  it('opens with the skip link, pointed at the target the props name', () => {
    const { container } = renderBlock(definition, Navbar)

    const skip = screen.getByTestId('navbar-skip-link')

    expect(skip).toHaveTextContent(SKIP_LINK_LABEL)
    expect(skip).toHaveAttribute('href', definition.defaults.skipLinkTarget)
    expect(container.querySelector('[data-testid="navbar"]')?.firstElementChild).toBe(skip)
  })

  it('drops the skip link when the page already has one', () => {
    renderBlock(definition, Navbar, { skipLink: false })

    expect(screen.queryByTestId('navbar-skip-link')).toBeNull()
  })

  it('renders a link as a link and a link with children as a trigger', () => {
    renderBlock(definition, Navbar)

    const triggers = screen.getAllByTestId('navbar-trigger')
    const withChildren = definition.defaults.links.filter((link) => link.children.length > 0)

    expect(triggers).toHaveLength(withChildren.length)
    expect(triggers[0]).toHaveAttribute('aria-expanded', 'false')
  })

  it('opens the dropdown and says so on the trigger', async () => {
    const user = userEvent.setup()

    renderBlock(definition, Navbar)

    const trigger = requireAt(screen.getAllByTestId('navbar-trigger'), 0)

    await user.click(trigger)

    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByTestId('navbar-panel')).toBeInTheDocument()
  })

  it('closes the dropdown on Escape', async () => {
    const user = userEvent.setup()

    renderBlock(definition, Navbar)

    const trigger = requireAt(screen.getAllByTestId('navbar-trigger'), 0)

    await user.click(trigger)
    await screen.findByTestId('navbar-panel')

    /*
     * The subject is that `Esc` closes the menu — ACCESSIBILITY.md § Landing, gallery, docs — and the
     * press is repeated until it does, because the thing it can arrive before leaves no trace to wait
     * for instead.
     *
     * Radix dismisses on a layer that subscribes in an effect after the panel mounts. The panel being
     * in the DOM is what a query can see; the subscription is not. Locally the two are inseparable —
     * eight consecutive runs of this file closed on the first press — and on the shared runner, with
     * the coverage pass competing for two cores, a single press was still being lost after 15 s of
     * waiting, which is a press nobody heard rather than a close nobody waited for.
     */
    await waitFor(
      async () => {
        await user.keyboard('{Escape}')
        expect(trigger).toHaveAttribute('aria-expanded', 'false')
      },
      { timeout: 15_000 },
    )
    // The whole test, not only the wait: `userEvent` spends real time between every synthetic event.
  }, 30_000)

  it('moves along the bar with the arrow keys', async () => {
    const user = userEvent.setup()

    renderBlock(definition, Navbar)

    const first = requireAt(screen.getAllByTestId('nav-link'), 0)

    first.focus()
    await user.keyboard('{ArrowRight}')

    expect(document.activeElement).toBe(requireAt(screen.getAllByTestId('navbar-trigger'), 0))
  })

  it('labels the drawer trigger and reports its state', async () => {
    const user = userEvent.setup()

    renderBlock(definition, Navbar)

    const trigger = screen.getByTestId('nav-drawer-trigger')

    expect(trigger).toHaveAccessibleName(OPEN_MENU_LABEL)
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    await user.click(trigger)

    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByTestId('nav-drawer-close')).toHaveAccessibleName(CLOSE_MENU_LABEL)
  })

  it('traps focus inside the drawer', async () => {
    const user = userEvent.setup()

    renderBlock(definition, Navbar)

    await user.click(screen.getByTestId('nav-drawer-trigger'))

    const drawer = screen.getByTestId('nav-drawer')

    for (let step = 0; step < 12; step += 1) {
      await user.tab()

      expect(drawer.contains(document.activeElement)).toBe(true)
    }
  })

  it('closes the drawer on Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup()

    renderBlock(definition, Navbar)

    const trigger = screen.getByTestId('nav-drawer-trigger')

    await user.click(trigger)
    await screen.findByTestId('nav-drawer')
    await user.keyboard('{Escape}')

    await waitFor(() => {
      expect(screen.queryByTestId('nav-drawer')).toBeNull()
    })
    expect(document.activeElement).toBe(trigger)
  })

  it('marks the current page with aria-current and not with colour alone', () => {
    const href = requireAt(definition.defaults.links, 0).href

    renderBlock(definition, Navbar, { activeHref: href })

    const current = screen
      .getAllByTestId('nav-link')
      .filter((link) => link.getAttribute('href') === href)

    expect(current.length).toBeGreaterThan(0)

    for (const link of current) {
      expect(link).toHaveAttribute('aria-current', 'page')
      expect(link.className).toContain('font-medium')
    }
  })

  it('leaves aria-current off every link when no page is current', () => {
    renderBlock(definition, Navbar)

    for (const link of screen.getAllByTestId('nav-link')) {
      expect(link).not.toHaveAttribute('aria-current')
    }
  })

  it('earns the sticky treatment rather than wearing it at the top of the page', () => {
    renderBlock(definition, Navbar)

    const bar = screen.getByTestId('navbar')

    expect(bar).toHaveAttribute('data-scrolled', 'false')
    expect(bar.className).toContain('data-[scrolled=true]:backdrop-blur-xl')
    expect(bar.className).toContain('border-transparent')
  })

  it('declares the two primitives the export has to install', () => {
    expect(definition.codegen.dependencies).toHaveProperty('@radix-ui/react-navigation-menu')
    expect(definition.codegen.dependencies).toHaveProperty('@radix-ui/react-dialog')
  })

  it('has no axe violations', async () => {
    const { container } = renderBlock(definition, Navbar)

    await expectNoViolations(container)
  })

  it('has no axe violations with the drawer open', async () => {
    const user = userEvent.setup()
    const { baseElement } = renderBlock(definition, Navbar)

    await user.click(screen.getByTestId('nav-drawer-trigger'))

    await expectNoViolations(baseElement)
  })
})
