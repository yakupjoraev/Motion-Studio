import type { BlockDefinition } from '@motion-studio/schema'
import { nodeId } from '@motion-studio/schema'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { BlockInspector } from './block-inspector'

/**
 * The sections themselves are stubs: the subject is the boundary around each of them, and a generated
 * control that throws is exactly what it is for. `orderedGroups` stays real — it decides which
 * sections exist, which is what makes the "the others keep working" claim mean anything.
 */
const { layoutThrows } = vi.hoisted(() => ({ layoutThrows: { value: true } }))

vi.mock('./universal-sections/index', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./universal-sections/index')>()),
  LayoutSection: () => {
    if (layoutThrows.value) {
      throw new TypeError('padding.top is not a number')
    }

    return <p>Layout controls</p>
  },
  StyleSection: () => <p>Style controls</p>,
  MotionSection: () => <p>Motion controls</p>,
  EffectsSection: () => <p>Effects controls</p>,
  CodeSection: () => <p>Code controls</p>,
  BlockSection: () => <p>Block controls</p>,
}))

const definition = {
  controls: [
    { id: 'layout', label: 'Layout', controls: [{ path: 'padding.top', kind: 'number' }] },
    { id: 'style', label: 'Style', controls: [{ path: 'background', kind: 'color' }] },
  ],
} as unknown as BlockDefinition

let consoleError: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  layoutThrows.value = true
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
})

afterEach(() => {
  consoleError.mockRestore()
})

const renderInspector = (): void => {
  render(<BlockInspector definition={definition} nodeIds={[nodeId('node_a3f2')]} />)
}

describe('the inspector section boundary', () => {
  it('collapses the section that threw to a chip naming it', () => {
    renderInspector()

    expect(screen.getByTestId('section-error')).toHaveTextContent(
      'Layout controls failed to render. The other sections still work.',
    )
  })

  it('keeps every other section usable', () => {
    renderInspector()

    expect(screen.getByText('Style controls')).toBeInTheDocument()
    expect(screen.getByText('Motion controls')).toBeInTheDocument()
    expect(screen.getByText('Effects controls')).toBeInTheDocument()
    expect(screen.getAllByTestId('section-error')).toHaveLength(1)
  })

  it('offers the document download from the chip', () => {
    renderInspector()

    expect(screen.getByRole('button', { name: 'Download' })).toBeInTheDocument()
  })

  it('renders the section again once the control stops throwing', async () => {
    renderInspector()
    layoutThrows.value = false

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(screen.getByText('Layout controls')).toBeInTheDocument()
    expect(screen.queryByTestId('section-error')).toBeNull()
  })

  it('names the section it caught in, so a production log says which one', () => {
    renderInspector()

    expect(consoleError.mock.calls.map((call) => String(call[0])).join('\n')).toContain(
      '[inspector:Layout]',
    )
  })
})
