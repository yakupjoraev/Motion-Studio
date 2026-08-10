import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { renderDnd } from '../test/harness'
import { stubPointerEvents } from '../test/pointer'
import { ACTIVATION_DISTANCE_PX } from './pointer-sensor'

const drag = (distance: number): void => {
  const card = screen.getByTestId('palette-card')

  fireEvent.pointerDown(card, { clientX: 100, clientY: 100, button: 0, isPrimary: true })
  fireEvent.pointerMove(document, { clientX: 100 + distance, clientY: 100 })
}

describe('the pointer activation constraint', () => {
  beforeEach(() => {
    stubPointerEvents()
  })

  it('is 4 px, because a click is not a drag', () => {
    expect(ACTIVATION_DISTANCE_PX).toBe(4)
  })

  it('does not start a drag at 3 px', () => {
    renderDnd()
    drag(3)

    expect(screen.queryByTestId('block-card-preview')).toBeNull()
  })

  it('starts one at 5 px', () => {
    renderDnd()
    drag(5)

    expect(screen.getByTestId('block-card-preview')).toBeInTheDocument()
  })
})
