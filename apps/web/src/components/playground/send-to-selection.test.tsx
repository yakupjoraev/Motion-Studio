import { nodeId } from '@motion-studio/schema'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { escapeHatchPort } from '../../store/escape-hatch-port'

import type { PlaygroundProperty } from './properties'
import { SendToSelection, useSendToSelection } from './send-to-selection'

const NODE = nodeId('node_hero')

function Harness({
  property = 'box-shadow',
  value = '0 8px 24px black',
}: { readonly property?: PlaygroundProperty; readonly value?: string }) {
  const action = useSendToSelection(property, value)

  return <SendToSelection action={action} disabled={false} />
}

const select = (properties: readonly string[]): void => {
  escapeHatchPort.publish({
    nodeId: NODE,
    nodeName: 'Hero band',
    blockName: 'Section',
    properties,
    css: '',
  })
}

afterEach(() => {
  escapeHatchPort.reset()
})

describe('send to selection', () => {
  it('is disabled with nothing selected and says what to do', () => {
    render(<Harness />)

    expect(screen.getByTestId('send-to-selection')).toBeDisabled()
    expect(screen.getByTestId('send-reason')).toHaveTextContent('Select one block in the studio')
  })

  it('names the selected node once there is one', () => {
    select(['box-shadow'])
    render(<Harness />)

    expect(screen.getByRole('button', { name: 'Send to Hero band' })).toBeEnabled()
  })

  it('says why a property the block does not accept is refused', () => {
    select(['box-shadow'])
    render(<Harness property="backdrop-filter" value="blur(12px)" />)

    expect(screen.getByTestId('send-to-selection')).toBeDisabled()
    expect(screen.getByTestId('send-reason')).toHaveTextContent(
      'Section does not take backdrop-filter from here',
    )
  })

  it('writes through the port and says it landed', async () => {
    const user = userEvent.setup()
    const writer = vi.fn()

    select(['box-shadow'])
    escapeHatchPort.register(writer)
    render(<Harness />)
    await user.click(screen.getByTestId('send-to-selection'))

    expect(writer).toHaveBeenCalledWith('box-shadow', '0 8px 24px black')
    expect(await screen.findByText(/sent to Hero band/)).toBeInTheDocument()
  })

  it('says the studio is not listening when no writer is registered', async () => {
    const user = userEvent.setup()

    select(['box-shadow'])
    render(<Harness />)
    await user.click(screen.getByTestId('send-to-selection'))

    expect(await screen.findByText(/not listening/)).toBeInTheDocument()
  })
})
