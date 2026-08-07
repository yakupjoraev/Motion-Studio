import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { expectNoViolations } from '../../test/axe'

import { LinkField } from './link-field'

import type { LinkFieldProps } from './link-field.types'

const Fixture = (props: Partial<LinkFieldProps>): ReactElement => (
  <LinkField
    label="Link"
    value={{ href: 'https://motion.studio', target: '_self', rel: [] }}
    onChange={() => undefined}
    onCommit={() => undefined}
    {...props}
  />
)

const url = (): HTMLElement => screen.getByRole('textbox', { name: 'Link URL' })

describe('LinkField', () => {
  it('offers the URL, the target and the rel tokens', () => {
    render(<Fixture />)

    expect(url()).toHaveValue('https://motion.studio')
    expect(screen.getByRole('radio', { name: 'New tab' })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'noopener' })).toBeInTheDocument()
  })

  it('says nothing about a URL that is fine', () => {
    render(<Fixture />)

    expect(url()).not.toHaveAttribute('aria-invalid')
    expect(screen.getByRole('group', { name: 'Link' })).not.toHaveAccessibleDescription()
  })

  it('names the problem with a refused scheme rather than only colouring the border', () => {
    render(<Fixture value={{ href: 'javascript:alert(1)', target: '_self', rel: [] }} />)

    expect(screen.getByText('javascript: links are not allowed.')).toBeInTheDocument()
    expect(url()).toHaveAttribute('aria-invalid', 'true')
  })

  it('announces the problem through the group description', () => {
    render(<Fixture value={{ href: 'motion.studio', target: '_self', rel: [] }} />)

    expect(screen.getByRole('group', { name: 'Link' })).toHaveAccessibleDescription(/Add a scheme/)
  })

  it('warns when a new tab has no noopener', () => {
    render(<Fixture value={{ href: 'https://motion.studio', target: '_blank', rel: [] }} />)

    expect(screen.getByText(/rel="noopener"/)).toBeInTheDocument()
  })

  it('stops warning once noopener is set', () => {
    render(
      <Fixture value={{ href: 'https://motion.studio', target: '_blank', rel: ['noopener'] }} />,
    )

    expect(screen.queryByText(/rel="noopener"/)).toBeNull()
  })

  it('commits the URL on Enter and reports each keystroke', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const onCommit = vi.fn()

    render(
      <Fixture
        value={{ href: '', target: '_self', rel: [] }}
        onChange={onChange}
        onCommit={onCommit}
      />,
    )
    await user.type(url(), '/pricing{Enter}')

    expect(onChange).toHaveBeenCalled()
    expect(onCommit).toHaveBeenCalledWith({ href: '/pricing', target: '_self', rel: [] })
  })

  it('switches the target', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(<Fixture onCommit={onCommit} />)
    await user.click(screen.getByRole('radio', { name: 'New tab' }))

    expect(onCommit).toHaveBeenLastCalledWith({
      href: 'https://motion.studio',
      target: '_blank',
      rel: [],
    })
  })

  it('toggles a rel token', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(<Fixture onCommit={onCommit} />)
    await user.click(screen.getByRole('checkbox', { name: 'nofollow' }))

    expect(onCommit).toHaveBeenLastCalledWith({
      href: 'https://motion.studio',
      target: '_self',
      rel: ['nofollow'],
    })
  })

  it('emits the rel tokens in a fixed order, so two equal links produce one attribute', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(
      <Fixture
        value={{ href: 'https://motion.studio', target: '_self', rel: ['nofollow'] }}
        onCommit={onCommit}
      />,
    )
    await user.click(screen.getByRole('checkbox', { name: 'noopener' }))

    expect(onCommit.mock.lastCall?.[0].rel).toEqual(['noopener', 'nofollow'])
  })

  it('removes a rel token it already had', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(
      <Fixture
        value={{ href: 'https://motion.studio', target: '_self', rel: ['noopener'] }}
        onCommit={onCommit}
      />,
    )
    await user.click(screen.getByRole('checkbox', { name: 'noopener' }))

    expect(onCommit.mock.lastCall?.[0].rel).toEqual([])
  })

  it('says nothing about a mixed selection, having nothing to validate', () => {
    render(<Fixture mixed value={{ href: '', target: '_self', rel: [] }} />)

    expect(screen.queryByText('Enter a URL.')).toBeNull()
    expect(url()).toHaveAttribute('placeholder', 'Mixed')
  })

  it('takes the row id on the URL field, which is what focusing the control means', () => {
    render(<Fixture id="row-control" />)

    expect(url()).toHaveAttribute('id', 'row-control')
  })

  it('is not operable when disabled', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(<Fixture disabled onCommit={onCommit} />)
    await user.click(screen.getByRole('checkbox', { name: 'noopener' }))

    expect(onCommit).not.toHaveBeenCalled()
  })

  it('has no axe violations', async () => {
    const { container } = render(<Fixture />)

    await expectNoViolations(container)
  })

  it('has no axe violations while reporting a problem', async () => {
    const { container } = render(<Fixture value={{ href: '', target: '_blank', rel: [] }} />)

    await expectNoViolations(container)
  })
})
