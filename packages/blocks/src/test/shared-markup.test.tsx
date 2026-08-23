import { ICON_REGISTRY, type IconName } from '@motion-studio/icons'
import { txt } from '@motion-studio/schema'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ControlIcon } from '../interactive/control-icon'
import { controlIconMarkup } from '../interactive/control-icon.markup'
import { iconMarkup } from '../markup/icon'
import { NavAction } from '../navigation/nav-action'
import { navActionMarkup } from '../navigation/nav-action.markup'
import { NavIcon } from '../navigation/nav-icon'
import { navIconMarkup } from '../navigation/nav-icon.markup'
import { NavLink } from '../navigation/nav-link'
import { navLinkMarkup } from '../navigation/nav-link.markup'

import { expectParity } from './expect-parity'

describe('an icon as markup', () => {
  /** One of each shape the table holds: a bare path, a circle, filled dots, a dash pattern, a wedge. */
  const cases: readonly IconName[] = ['plus', 'search', 'noise', 'blur', 'opacity', 'curve']

  it.each(cases)('draws %s the way its component does', (name) => {
    const Icon = ICON_REGISTRY[name]

    expectParity(
      iconMarkup({ name, size: 18, className: 'text-accent' }),
      <Icon aria-hidden="true" className="text-accent" size={18} />,
    )
  })

  it('labels a glyph the call site named', () => {
    const Icon = ICON_REGISTRY['search']

    expectParity(
      iconMarkup({ name: 'search', size: 16, label: 'Search' }),
      <Icon aria-label="Search" size={16} />,
    )
  })

  it('draws nothing for a name the set does not know', () => {
    expect(iconMarkup({ name: 'not-an-icon', size: 16 })).toBeNull()
  })
})

describe('the two glyph wrappers', () => {
  it('matches ControlIcon', () => {
    expectParity(
      controlIconMarkup({ name: 'chevron-down', size: 14, className: 'opacity-70' }),
      <ControlIcon className="opacity-70" name="chevron-down" size={14} />,
    )
  })

  it('matches NavIcon at its own default size', () => {
    expectParity(navIconMarkup({ name: 'menu' }), <NavIcon name="menu" />)
  })

  it('draws nothing for an unknown name, as both components do', () => {
    expect(controlIconMarkup({ name: 'nope', size: 16 })).toBeNull()
    expect(navIconMarkup({ name: 'nope' })).toBeNull()
    expect(render(<NavIcon name="nope" />).container.firstElementChild).toBeNull()
  })
})

describe('the navigation subcomponents', () => {
  it('matches an inactive NavLink', () => {
    expectParity(
      navLinkMarkup({
        href: '/pricing',
        activeHref: '/',
        variant: 'bar',
        children: [txt('Pricing')],
      }),
      <NavLink activeHref="/" href="/pricing" variant="bar">
        Pricing
      </NavLink>,
    )
  })

  it('matches the current NavLink, aria-current included', () => {
    expectParity(
      navLinkMarkup({
        href: '/pricing',
        activeHref: '/pricing',
        variant: 'drawer',
        className: 'w-full',
        children: [txt('Pricing')],
      }),
      <NavLink activeHref="/pricing" className="w-full" href="/pricing" variant="drawer">
        Pricing
      </NavLink>,
    )
  })

  it('matches a NavAction', () => {
    const action = { label: 'Sign in', href: '', variant: 'ghost' } as const

    expectParity(navActionMarkup(action), <NavAction action={action} />)
  })
})
