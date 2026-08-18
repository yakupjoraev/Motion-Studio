import { MotionSchedulerProvider } from '@motion-studio/motion'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'
import { requireAt } from '../../test/require-at'

import { NavbarFloating } from './navbar-floating'
import { navbarFloatingDefinition as definition } from './navbar-floating.definition'
import { FLOATING_SHRINK_PX } from './navbar-floating.schema'

describe('NavbarFloating', () => {
  it('is one labelled navigation landmark', () => {
    renderBlock(definition, NavbarFloating)

    const landmarks = screen.getAllByRole('navigation')

    expect(landmarks).toHaveLength(1)
    expect(landmarks[0]).toHaveAccessibleName(definition.defaults.ariaLabel)
  })

  it('takes the theme glass recipe rather than a blur of its own', () => {
    renderBlock(definition, NavbarFloating)

    const bar = screen.getByTestId('navbar-floating')

    expect(bar.className).toContain('ms-glass')
    expect(bar.className).not.toContain('backdrop-blur')
    expect(definition.capabilities.requiresBackdrop).toBe(true)
  })

  it('starts unscrolled and shrinks by padding only', () => {
    renderBlock(definition, NavbarFloating)

    const bar = screen.getByTestId('navbar-floating')

    expect(bar).toHaveAttribute('data-scrolled', 'false')
    expect(bar.className).toContain('data-[scrolled=true]:py-1')
    expect(bar.className).not.toContain('data-[scrolled=true]:scale')
  })

  it('animates the shrink on the duration token, so reduced motion collapses it', () => {
    renderBlock(definition, NavbarFloating)

    expect(screen.getByTestId('navbar-floating').className).toContain(
      '[transition-duration:var(--ms-duration-fast)]',
    )
  })

  it('writes the scrolled state from the scroll bus past the threshold', () => {
    const props = definition.propsSchema.parse(definition.defaults)

    render(
      <MotionSchedulerProvider>
        <NavbarFloating {...props} />
      </MotionSchedulerProvider>,
    )

    const bar = screen.getByTestId('navbar-floating')

    expect(bar).toHaveAttribute('data-scrolled', 'false')
    expect(FLOATING_SHRINK_PX).toBeGreaterThan(0)
  })

  it('moves the links into the drawer below sm and keeps them in the pill above it', () => {
    renderBlock(definition, NavbarFloating)

    expect(screen.getByTestId('navbar-floating-links').className).toContain('sm:flex')
    expect(screen.getByTestId('nav-drawer-trigger')).toBeInTheDocument()
  })

  it('marks the current page with aria-current and not with colour alone', () => {
    const href = requireAt(definition.defaults.links, 1).href

    renderBlock(definition, NavbarFloating, { activeHref: href })

    const current = screen
      .getAllByTestId('nav-link')
      .filter((link) => link.getAttribute('href') === href)

    expect(current.length).toBeGreaterThan(0)

    for (const link of current) {
      expect(link).toHaveAttribute('aria-current', 'page')
      expect(link.className).toContain('font-medium')
    }
  })

  it('has no axe violations', async () => {
    const { container } = renderBlock(definition, NavbarFloating)

    await expectNoViolations(container)
  })
})
