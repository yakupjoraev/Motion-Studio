import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { expectNoViolations } from '../../test/axe'

import { ImageField } from './image-field'

import type { ImageFieldProps } from './image-field.types'

const Fixture = (props: Partial<ImageFieldProps>): ReactElement => (
  <ImageField
    label="Image"
    value={{ src: 'https://motion.studio/hero.png', alt: 'The studio' }}
    onChange={() => undefined}
    onCommit={() => undefined}
    {...props}
  />
)

describe('ImageField', () => {
  it('previews the image with the alt text being edited', () => {
    render(<Fixture />)

    expect(screen.getByRole('img', { name: 'The studio' })).toHaveAttribute(
      'src',
      'https://motion.studio/hero.png',
    )
  })

  it('draws no preview when there is no image', () => {
    render(<Fixture value={{ src: '', alt: '' }} />)

    expect(screen.queryByRole('img')).toBeNull()
  })

  it('holds the aspect the caller asked for', () => {
    const { container } = render(<Fixture aspect={1} />)

    expect(container.querySelector('[style*="aspect-ratio"]')).not.toBeNull()
  })

  it('warns when an image has no alt text', () => {
    render(<Fixture value={{ src: 'https://motion.studio/hero.png', alt: '  ' }} />)

    expect(screen.getByText(/invisible to a screen reader/)).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Image alt text' })).toHaveAttribute(
      'aria-invalid',
      'true',
    )
  })

  it('announces the warning through the group description', () => {
    render(<Fixture value={{ src: 'https://motion.studio/hero.png', alt: '' }} />)

    expect(screen.getByRole('group', { name: 'Image' })).toHaveAccessibleDescription(
      /invisible to a screen reader/,
    )
  })

  it('does not warn before there is an image to describe', () => {
    render(<Fixture value={{ src: '', alt: '' }} />)

    expect(screen.queryByText(/invisible to a screen reader/)).toBeNull()
  })

  it('commits a typed URL', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(<Fixture value={{ src: '', alt: 'The studio' }} onCommit={onCommit} />)
    await user.type(screen.getByRole('textbox', { name: 'Image URL' }), '/hero.png{Enter}')

    expect(onCommit).toHaveBeenCalledWith({ src: '/hero.png', alt: 'The studio' })
  })

  it('commits typed alt text', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(<Fixture value={{ src: '/hero.png', alt: '' }} onCommit={onCommit} />)
    await user.type(screen.getByRole('textbox', { name: 'Image alt text' }), 'A panel{Enter}')

    expect(onCommit).toHaveBeenCalledWith({ src: '/hero.png', alt: 'A panel' })
  })

  it('takes an uploaded file into the value as a data URL', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()
    const { container } = render(<Fixture value={{ src: '', alt: 'Logo' }} onCommit={onCommit} />)
    const input = container.querySelector('input[type="file"]')

    expect(input).not.toBeNull()
    await user.upload(
      input as HTMLInputElement,
      new File(['<svg/>'], 'logo.svg', { type: 'image/svg+xml' }),
    )

    await waitFor(() => {
      expect(onCommit.mock.lastCall?.[0].src).toMatch(/^data:image\/svg\+xml/)
    })
  })

  it('keeps the file input out of the tab order, since the button is the affordance', () => {
    const { container } = render(<Fixture />)

    expect(container.querySelector('input[type="file"]')).toHaveAttribute('tabindex', '-1')
    expect(screen.getByRole('button', { name: 'Upload image' })).toBeInTheDocument()
  })

  it('says Mixed and previews nothing across a disagreeing selection', () => {
    render(<Fixture mixed />)

    expect(screen.queryByRole('img')).toBeNull()
    expect(screen.getByRole('textbox', { name: 'Image URL' })).toHaveAttribute(
      'placeholder',
      'Mixed',
    )
  })

  it('is not operable when disabled', () => {
    render(<Fixture disabled />)

    expect(screen.getByRole('button', { name: 'Upload image' })).toBeDisabled()
    expect(screen.getByRole('textbox', { name: 'Image URL' })).toBeDisabled()
  })

  it('has no axe violations', async () => {
    const { container } = render(<Fixture />)

    await expectNoViolations(container)
  })
})
