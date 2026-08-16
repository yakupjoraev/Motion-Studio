import { MotionSchedulerProvider } from '@motion-studio/motion'
import { fireEvent, render, screen } from '@testing-library/react'
import { act } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'

import { Spotlight } from './spotlight'
import { spotlightDefinition } from './spotlight.definition'

const definition = spotlightDefinition

/** The layer has no size in jsdom unless it is given one, and the maths divides by it. */
const withBox = (element: HTMLElement): void => {
  element.getBoundingClientRect = () => ({ left: 100, top: 50, width: 200, height: 100 }) as DOMRect
}

describe('Spotlight', () => {
  it('positions the light from variables, not from React state', () => {
    renderBlock(definition, Spotlight, { reach: 60 })

    const layer = screen.getByTestId('spotlight')

    expect(layer.style.getPropertyValue('--ms-fx-reach')).toBe('60%')
    expect(layer.style.getPropertyValue('--ms-fx-x')).toBe('')
  })

  it('follows the shared pointer bus, converting the page point into its own box', () => {
    render(
      <MotionSchedulerProvider>
        <Spotlight {...definition.defaults} />
      </MotionSchedulerProvider>,
    )

    const layer = screen.getByTestId('spotlight')
    withBox(layer)

    const raf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0)

      return 1
    })

    act(() => {
      fireEvent(
        document,
        new MouseEvent('pointermove', { clientX: 150, clientY: 75, bubbles: true }),
      )
    })

    expect(layer.style.getPropertyValue('--ms-fx-x')).toBe('25%')
    expect(layer.style.getPropertyValue('--ms-fx-y')).toBe('25%')

    raf.mockRestore()
  })

  it('subscribes to nothing when the pointer is not being followed', () => {
    render(
      <MotionSchedulerProvider>
        <Spotlight {...definition.defaults} followPointer={false} />
      </MotionSchedulerProvider>,
    )

    const layer = screen.getByTestId('spotlight')
    withBox(layer)

    act(() => {
      fireEvent(
        document,
        new MouseEvent('pointermove', { clientX: 150, clientY: 75, bubbles: true }),
      )
    })

    expect(layer.style.getPropertyValue('--ms-fx-x')).toBe('')
    expect(layer).toHaveAttribute('data-follows', 'false')
  })

  it('renders a centred light with no scheduler around it', () => {
    const { container } = renderBlock(definition, Spotlight)

    expect(container.querySelector('.ms-fx-spotlight')).not.toBeNull()
    expect(screen.getByTestId('spotlight').style.getPropertyValue('--ms-fx-x')).toBe('')
  })

  it('has no axe violations', async () => {
    await expectNoViolations(renderBlock(definition, Spotlight).container)
  })
})
