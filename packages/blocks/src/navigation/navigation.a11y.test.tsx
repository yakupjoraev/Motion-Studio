import type { RenderResult } from '@testing-library/react'
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { expectNoViolations, renderBlock } from '../test/render-block'

import { Breadcrumbs } from './breadcrumbs/breadcrumbs'
import { breadcrumbsDefinition } from './breadcrumbs/breadcrumbs.definition'
import { definitions } from './definitions'
import { Dock } from './dock/dock'
import { dockDefinition } from './dock/dock.definition'
import { Footer } from './footer/footer'
import { footerDefinition } from './footer/footer.definition'
import { NavbarFloating } from './navbar-floating/navbar-floating'
import { navbarFloatingDefinition } from './navbar-floating/navbar-floating.definition'
import { Navbar } from './navbar/navbar'
import { navbarDefinition } from './navbar/navbar.definition'
import { SidebarNav } from './sidebar-nav/sidebar-nav'
import { sidebarNavDefinition } from './sidebar-nav/sidebar-nav.definition'

/**
 * The category's own gate. Prompt 39 holds navigation to stricter requirements than the rest of the
 * registry, and the ones that hold for all six belong in one place rather than six times over.
 *
 * The cases are written out rather than derived from `components`, because deriving them would need a
 * cast from the render registry's `ComponentType<never>` back to each block's props, and § 1 of the
 * contract has no room for one.
 */
const LANDMARK_ROLES = ['navigation', 'contentinfo', 'banner', 'main', 'complementary'] as const

interface Case {
  readonly id: string
  readonly role: 'navigation' | 'contentinfo'
  readonly label: string
  readonly render: () => RenderResult
}

const CASES: readonly Case[] = [
  {
    id: 'navbar',
    role: 'navigation',
    label: navbarDefinition.defaults.ariaLabel,
    render: () => renderBlock(navbarDefinition, Navbar),
  },
  {
    id: 'navbar-floating',
    role: 'navigation',
    label: navbarFloatingDefinition.defaults.ariaLabel,
    render: () => renderBlock(navbarFloatingDefinition, NavbarFloating),
  },
  {
    id: 'sidebar-nav',
    role: 'navigation',
    label: sidebarNavDefinition.defaults.ariaLabel,
    render: () => renderBlock(sidebarNavDefinition, SidebarNav),
  },
  {
    id: 'footer',
    role: 'contentinfo',
    label: footerDefinition.defaults.ariaLabel,
    render: () => renderBlock(footerDefinition, Footer),
  },
  {
    id: 'breadcrumbs',
    role: 'navigation',
    label: breadcrumbsDefinition.defaults.ariaLabel,
    render: () => renderBlock(breadcrumbsDefinition, Breadcrumbs),
  },
  {
    id: 'dock',
    role: 'navigation',
    label: dockDefinition.defaults.ariaLabel,
    render: () => renderBlock(dockDefinition, Dock),
  },
]

describe('the navigation category', () => {
  it('covers every block in the category', () => {
    expect(CASES.map((one) => one.id)).toEqual(Object.keys(definitions))
  })
})

describe.each(CASES.map((one) => [one.id, one] as const))('%s', (id, subject) => {
  it('is its own landmark, and the landmark is named', () => {
    const { container } = subject.render()

    const root = container.firstElementChild

    expect(root).not.toBeNull()
    expect(screen.getAllByRole(subject.role)[0]).toBe(root)
    expect(root).toHaveAccessibleName(subject.label)
  })

  it('names every landmark it draws, not just its own', () => {
    subject.render()

    for (const role of LANDMARK_ROLES) {
      for (const landmark of screen.queryAllByRole(role)) {
        expect(landmark, `${id}: unnamed ${role}`).toHaveAccessibleName()
      }
    }
  })

  it('names every interactive element it draws', () => {
    subject.render()

    for (const element of [...screen.queryAllByRole('link'), ...screen.queryAllByRole('button')]) {
      expect(element, `${id}: unnamed control`).toHaveAccessibleName()
    }
  })

  /*
   * Reduced motion, as far as a unit test reaches: every transition in the category is timed by a
   * duration token, and the tokens are `calc(… * var(--ms-reduced-motion))` — so the media query and the
   * studio's own preview override both collapse them, while the state change they were animating stays.
   * A hard-coded `duration-200` anywhere here would survive both, which is the defect this catches.
   */
  it('times every transition with a duration token', () => {
    const { container } = subject.render()

    for (const element of container.querySelectorAll('[class*="transition"]')) {
      // `getAttribute`, not `className`: on an SVG that property is an animated-string object, and the
      // chevrons in this category are SVGs that carry their own transition.
      expect(element.getAttribute('class'), `${id}: untokenised transition`).toContain(
        '[transition-duration:var(--ms-duration-',
      )
    }
  })

  it('has no axe violations', async () => {
    const { container } = subject.render()

    await expectNoViolations(container)
  })
})
